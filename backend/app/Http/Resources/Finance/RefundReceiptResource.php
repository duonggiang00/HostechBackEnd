<?php

namespace App\Http\Resources\Finance;

use App\Models\Contract\RefundReceipt;
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

        return [
            'id' => $this->id,
            'amount' => (float) $this->amount,
            'contract_id' => $this->contract_id,
            'property_id' => $contract?->property_id,
            'room_id' => $contract?->room_id,
            'room_name' => $contract?->room?->name,
            'property_name' => $contract?->property?->name,
            'deposit_status' => $contract?->deposit_status instanceof \BackedEnum
                ? $contract->deposit_status->value
                : $contract?->deposit_status,
            'refunded_amount' => $contract !== null ? (float) $contract->refunded_amount : null,
            'meta' => $this->meta,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
