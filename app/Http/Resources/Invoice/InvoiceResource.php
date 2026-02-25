<?php

namespace App\Http\Resources\Invoice;

use App\Http\Resources\Contract\ContractResource;
use App\Http\Resources\Property\PropertyResource;
use App\Http\Resources\Property\RoomResource;
use App\Http\Resources\Org\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'org_id'        => $this->org_id,
            'status'        => $this->status,

            // Kỳ thanh toán
            'period_start'  => $this->period_start?->format('Y-m-d'),
            'period_end'    => $this->period_end?->format('Y-m-d'),
            'issue_date'    => $this->issue_date?->format('Y-m-d'),
            'due_date'      => $this->due_date?->format('Y-m-d'),

            // Tài chính
            'total_amount'  => (float) $this->total_amount,
            'paid_amount'   => (float) $this->paid_amount,
            'debt'          => (float) ($this->total_amount - $this->paid_amount),

            // Relationships (chỉ trả khi được eager load)
            'property'      => new PropertyResource($this->whenLoaded('property')),
            'room'          => new RoomResource($this->whenLoaded('room')),
            'contract'      => new ContractResource($this->whenLoaded('contract')),
            'items'         => InvoiceItemResource::collection($this->whenLoaded('items')),

            // Người tạo / phát hành
            'created_by'    => new UserResource($this->whenLoaded('createdBy')),
            'issued_by'     => new UserResource($this->whenLoaded('issuedBy')),

            // Timestamps
            'issued_at'     => $this->issued_at?->toIso8601String(),
            'cancelled_at'  => $this->cancelled_at?->toIso8601String(),
            'created_at'    => $this->created_at?->toIso8601String(),
            'updated_at'    => $this->updated_at?->toIso8601String(),
        ];
    }
}