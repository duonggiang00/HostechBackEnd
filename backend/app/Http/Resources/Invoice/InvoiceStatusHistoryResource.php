<?php

namespace App\Http\Resources\Invoice;

use App\Http\Resources\Org\UserResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceStatusHistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
            'from_status' => $this->from_status,
            'to_status' => $this->to_status,
            'note' => $this->note,
            'changed_by' => new UserResource($this->whenLoaded('changedBy')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
