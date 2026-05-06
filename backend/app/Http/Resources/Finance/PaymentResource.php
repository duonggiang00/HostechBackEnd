<?php

namespace App\Http\Resources\Finance;

use App\Http\Resources\Org\UserResource;
use App\Http\Resources\Property\PropertyResource;
use App\Models\Finance\Payment;
use App\Support\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class PaymentResource extends JsonResource
{
    private function requestedContractId(Request $request): ?string
    {
        $contractId = (string) $request->input('filter.contract_id', '');

        return $contractId !== '' ? $contractId : null;
    }

    /**
     * @return list<string>
     */
    private function sourceContractIds(): array
    {
        if (! $this->relationLoaded('allocations')) {
            return [];
        }

        $sourceContractIds = [];
        foreach ($this->allocations as $allocation) {
            $invoice = $allocation->relationLoaded('invoice') ? $allocation->invoice : null;
            if (! $invoice) {
                continue;
            }
            $sourceContractId = (string) ($invoice->snapshot['transfer_invoice_original_contract_id'] ?? $invoice->contract_id ?? '');
            if ($sourceContractId !== '') {
                $sourceContractIds[] = $sourceContractId;
            }
        }

        return array_values(array_unique($sourceContractIds));
    }

    private function isInherited(Request $request, array $sourceContractIds): bool
    {
        $requestedContractId = $this->requestedContractId($request);
        if (! $requestedContractId) {
            return false;
        }

        $includeInherited = filter_var($request->input('include_inherited', false), FILTER_VALIDATE_BOOLEAN);
        if (! $includeInherited) {
            return false;
        }

        foreach ($sourceContractIds as $sourceContractId) {
            if ($sourceContractId !== $requestedContractId) {
                return true;
            }
        }

        return false;
    }

    public function toArray(Request $request): array
    {
        /** @var Payment $this */
        $sourceContractIds = $this->sourceContractIds();

        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'property_id' => $this->property_id,
            'payer_user_id' => $this->payer_user_id,
            'status' => $this->status,
            'method' => $this->method,
            'method_label' => PaymentMethod::labelVi($this->method),
            'amount' => (float) $this->amount,
            'source_contract_ids' => $sourceContractIds,
            'is_inherited' => $this->isInherited($request, $sourceContractIds),
            'reference' => $this->reference,
            'note' => $this->note,
            'meta' => $this->meta,

            // Quan hệ (chỉ trả khi được eager load)
            'property' => new PropertyResource($this->whenLoaded('property')),
            'payer' => new UserResource($this->whenLoaded('payer')),
            'received_by' => new UserResource($this->whenLoaded('receivedBy')),
            'approved_by' => new UserResource($this->whenLoaded('approvedBy')),
            'allocations' => PaymentAllocationResource::collection($this->whenLoaded('allocations')),

            // Biên lai PDF chính thức (sau khi APPROVED)
            'receipt' => $this->whenLoaded('receipt', function () {
                if (! $this->receipt) {
                    return null;
                }

                return [
                    'id' => $this->receipt->id,
                    'kind' => $this->receipt->kind,
                    'url' => Storage::disk('public')->url($this->receipt->path),
                    'path' => $this->receipt->path,
                ];
            }),

            // Ảnh chứng từ tenant (trước khi duyệt)
            'proof_receipt' => $this->whenLoaded('proofReceipt', function () {
                if (! $this->proofReceipt) {
                    return null;
                }

                return [
                    'id' => $this->proofReceipt->id,
                    'kind' => $this->proofReceipt->kind,
                    'url' => Storage::disk('public')->url($this->proofReceipt->path),
                    'path' => $this->proofReceipt->path,
                ];
            }),

            // Timestamps
            'received_at' => $this->received_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
