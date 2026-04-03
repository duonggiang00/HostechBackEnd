<?php

namespace App\Features\Finance\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // $this->invoice có thể là MissingValue khi chưa eager load
        $invoice = $this->whenLoaded('invoice');
        $invoiceResolved = $invoice instanceof \Illuminate\Http\Resources\MissingValue ? null : $invoice;

        return [
            'id'             => $this->id,
            'invoice_id'     => $this->invoice_id,
            'amount'         => (float) $this->amount,
            // Thông tin hóa đơn inline cho UI hiển thị
            'invoice_code'   => $invoiceResolved?->reference_code ?? $invoiceResolved?->id,
            'invoice_status' => $invoiceResolved?->status,
            'invoice_total'  => $invoiceResolved ? (float) $invoiceResolved->total_amount : null,
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
