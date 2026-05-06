<?php

namespace App\Http\Resources\Invoice;

use App\Http\Resources\Contract\ContractResource;
use App\Http\Resources\Finance\PaymentAllocationResource;
use App\Http\Resources\Org\UserResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    private function requestedContractId(Request $request): ?string
    {
        $contractId = (string) $request->input('filter.contract_id', '');

        return $contractId !== '' ? $contractId : null;
    }

    private function sourceContractId(): ?string
    {
        $sourceContractId = (string) ($this->snapshot['transfer_invoice_original_contract_id'] ?? '');
        if ($sourceContractId !== '') {
            return $sourceContractId;
        }

        return $this->contract_id ? (string) $this->contract_id : null;
    }

    private function isInheritedRecord(Request $request, ?string $sourceContractId): bool
    {
        $requestedContractId = $this->requestedContractId($request);
        if (! $requestedContractId) {
            return false;
        }

        $includeInherited = filter_var($request->input('include_inherited', false), FILTER_VALIDATE_BOOLEAN);
        if (! $includeInherited) {
            return false;
        }

        return $sourceContractId !== null && $sourceContractId !== $requestedContractId;
    }

    public function toArray(Request $request): array
    {
        $sourceContractId = $this->sourceContractId();

        // Tên khách "đại diện" hợp đồng (primary member) — phục vụ trang Sổ cái tab "Tiền nợ".
        $tenantName = null;
        if ($this->relationLoaded('contract') && $this->contract) {
            $contract = $this->contract;
            if ($contract->relationLoaded('primaryMember') && $contract->primaryMember) {
                $member = $contract->primaryMember;
                $user = $member->relationLoaded('user') ? $member->user : null;
                $tenantName = $user?->full_name ?? $member->full_name ?? null;
            }
        }

        return [
            'id' => $this->id,
            'org_id' => $this->org_id,
            'contract_id' => $this->contract_id,
            'source_contract_id' => $sourceContractId,
            'is_inherited' => $this->isInheritedRecord($request, $sourceContractId),
            'status' => $this->status,
            'is_termination' => (bool) $this->is_termination,

            // Kỳ thanh toán
            'period_start' => $this->period_start?->format('Y-m-d'),
            'period_end' => $this->period_end?->format('Y-m-d'),
            'issue_date' => $this->issue_date?->format('Y-m-d'),
            'due_date' => $this->due_date?->format('Y-m-d'),

            // Tài chính
            'total_amount' => (float) $this->total_amount,
            'paid_amount' => (float) $this->paid_amount,
            'debt' => (float) ($this->total_amount - $this->paid_amount),
            'tenant_name' => $tenantName,

            // Relationships (chỉ trả khi được eager load)
            'property' => new PropertyResource($this->whenLoaded('property')),
            'room' => new RoomResource($this->whenLoaded('room')),
            'contract' => new ContractResource($this->whenLoaded('contract')),
            'items' => InvoiceItemResource::collection($this->whenLoaded('items')),
            'payment_allocations' => PaymentAllocationResource::collection($this->whenLoaded('paymentAllocations')),

            // Lịch sử thay đổi trạng thái
            'status_histories' => InvoiceStatusHistoryResource::collection($this->whenLoaded('statusHistories')),

            // Các khoản điều chỉnh (CREDIT/DEBIT)
            'adjustments' => InvoiceAdjustmentResource::collection($this->whenLoaded('adjustments')),

            // Người tạo / phát hành
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'issued_by' => new UserResource($this->whenLoaded('issuedBy')),

            // PDF
            'pdf_url' => $this->pdf_url,

            // Timestamps
            'issued_at' => $this->issued_at?->toIso8601String(),
            'cancelled_at' => $this->cancelled_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
