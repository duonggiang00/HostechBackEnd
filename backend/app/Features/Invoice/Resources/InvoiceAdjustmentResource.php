<?php

namespace App\Features\Invoice\Resources;

use App\Features\Org\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceAdjustmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'reason' => $this->reason,
            'is_approved' => $this->isApproved(),
            'created_by' => new UserResource($this->whenLoaded('createdBy')),
            'approved_by' => new UserResource($this->whenLoaded('approvedBy')),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
