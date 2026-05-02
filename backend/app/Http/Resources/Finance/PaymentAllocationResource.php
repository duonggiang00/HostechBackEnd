<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\MissingValue;

class PaymentAllocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // $this->invoice có thể là MissingValue khi chưa eager load
        $invoice = $this->whenLoaded('invoice');
        $invoiceResolved = $invoice instanceof MissingValue ? null : $invoice;

        return [
            'id' => $this->id,
            'invoice_id' => $this->invoice_id,
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
            ] : null,
            'payment' => new PaymentResource($this->whenLoaded('payment')),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
