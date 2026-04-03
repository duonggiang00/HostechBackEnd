<?php

namespace App\Features\Finance\Resources;

use App\Features\Org\Resources\UserResource;
use App\Features\Property\Resources\PropertyResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'status'      => $this->status,
            'method'      => $this->method,
            'amount'      => (float) $this->amount,
            'reference'   => $this->reference,
            'note'        => $this->note,

            // Quan hệ (chỉ trả khi được eager load)
            'property'    => new PropertyResource($this->whenLoaded('property')),
            'payer'       => new UserResource($this->whenLoaded('payer')),
            'received_by' => new UserResource($this->whenLoaded('receivedBy')),
            'approved_by' => new UserResource($this->whenLoaded('approvedBy')),
            'allocations' => PaymentAllocationResource::collection($this->whenLoaded('allocations')),

            // Timestamps
            'received_at' => $this->received_at?->toIso8601String(),
            'approved_at' => $this->approved_at?->toIso8601String(),
            'created_at'  => $this->created_at?->toIso8601String(),
            'updated_at'  => $this->updated_at?->toIso8601String(),
        ];
    }
}
