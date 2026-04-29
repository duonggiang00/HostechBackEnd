<?php

namespace App\Events\Finance;

use App\Models\Invoice\Invoice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Emitted when an invoice becomes PAID after a verified payment allocation.
 */
class InvoicePaidEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Invoice $invoice,
        public string $paymentId,
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('org.'.$this->invoice->org_id),
        ];

        if ($this->invoice->property_id) {
            $channels[] = new PrivateChannel('property.'.$this->invoice->property_id);
        }

        if ($this->invoice->payer_user_id) {
            $channels[] = new PrivateChannel('user.'.$this->invoice->payer_user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'invoice.paid';
    }

    public function broadcastWith(): array
    {
        return [
            'invoice_id' => $this->invoice->id,
            'property_id' => $this->invoice->property_id,
            'contract_id' => $this->invoice->contract_id,
            'room_id' => $this->invoice->room_id,
            'payment_id' => $this->paymentId,
            'status' => $this->invoice->status,
            'total_amount' => (float) $this->invoice->total_amount,
            'paid_amount' => (float) $this->invoice->paid_amount,
        ];
    }
}
