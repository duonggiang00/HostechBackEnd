<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\MissingValue;

class PaymentAllocationResource extends JsonResource
{
    private function requestedContractId(Request $request): ?string
    {
        $contractId = (string) $request->input('filter.contract_id', '');

        return $contractId !== '' ? $contractId : null;
    }

    private function sourceContractId($invoice): ?string
    {
        if (! $invoice) {
            return null;
        }

        $sourceContractId = (string) ($invoice->snapshot['transfer_invoice_original_contract_id'] ?? '');
        if ($sourceContractId !== '') {
            return $sourceContractId;
        }

        return $invoice->contract_id ? (string) $invoice->contract_id : null;
    }

    private function isInherited(Request $request, ?string $sourceContractId): bool
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
        // $this->invoice có thể là MissingValue khi chưa eager load
        $invoice = $this->whenLoaded('invoice');
        $invoiceResolved = $invoice instanceof MissingValue ? null : $invoice;
        $sourceContractId = $this->sourceContractId($invoiceResolved);
        $isInherited = $this->isInherited($request, $sourceContractId);

        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'source_contract_id' => $sourceContractId,
            'is_inherited' => $isInherited,
            'amount' => (float) $this->amount,
            // Thông tin hóa đơn inline cho UI hiển thị (tương thích client cũ)
            'invoice_code' => $invoiceResolved?->reference_code ?? $invoiceResolved?->id,
            'invoice_status' => $invoiceResolved?->status,
            'invoice_total' => $invoiceResolved ? (float) $invoiceResolved->total_amount : null,
            // Nested invoice — PaymentDetailPage FE đọc period_start / period_end / status tại đây
            'invoice' => $invoiceResolved ? [
                'id' => $invoiceResolved->id,
                'period_start' => $invoiceResolved->period_start?->format('Y-m-d'),
                'period_end' => $invoiceResolved->period_end?->format('Y-m-d'),
                'total_amount' => (float) $invoiceResolved->total_amount,
                'status' => $invoiceResolved->status,
                'source_contract_id' => $sourceContractId,
                'is_inherited' => $isInherited,
            ] : null,
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
