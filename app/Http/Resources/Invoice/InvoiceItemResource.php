<?php

namespace App\Http\Resources\Invoice;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'type'        => $this->type,
            'service_id'  => $this->service_id,
            'description' => $this->description,
            'quantity'    => (float) $this->quantity,
            'unit_price'  => (float) $this->unit_price,
            'amount'      => (float) $this->amount,
            'meta'        => $this->meta,
            'created_at'  => $this->created_at?->toIso8601String(),
        ];
    }
}