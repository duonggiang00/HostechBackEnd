<?php

namespace App\Http\Resources\Finance;

use App\Models\Contract\RefundReceipt;
use App\Services\Finance\ReceiptService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin RefundReceipt
 */
class RefundReceiptResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $contract = $this->relationLoaded('contract') ? $this->contract : null;
        $paidBy = $this->relationLoaded('paidBy') ? $this->paidBy : null;

        $pdfUrl = $this->pdf_path
            ? app(ReceiptService::class)->getRefundPdfUrl($this->resource)
            : null;

        $tenantName = null;
        if ($contract && $contract->relationLoaded('primaryMember') && $contract->primaryMember) {
            $member = $contract->primaryMember;
            $user = $member->relationLoaded('user') ? $member->user : null;
            $tenantName = $user?->full_name
                ?? $member->full_name
                ?? null;
        }

        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            'reference' => $this->reference,
            'contract_id' => $this->contract_id,
            'property_id' => $contract?->property_id,
            'room_id' => $contract?->room_id,
            'room_name' => $contract?->room?->name,
            'room_code' => $contract?->room?->code,
            'property_name' => $contract?->property?->name,
            'tenant_name' => $tenantName,
            'deposit_status' => $contract?->deposit_status instanceof \BackedEnum
                ? $contract->deposit_status->value
                : $contract?->deposit_status,
            'refunded_amount' => $contract !== null ? (float) $contract->refunded_amount : null,
            'meta' => $this->meta,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'payout_method' => $this->payout_method,
            'payout_reference' => $this->payout_reference,
            'paid_by_user' => $paidBy ? [
                'id' => $paidBy->id,
                'full_name' => $paidBy->full_name ?? $paidBy->name ?? null,
            ] : null,
            'pdf_url' => $pdfUrl,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
