<?php

namespace App\Events\Finance;

use App\Models\Finance\Payment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a Payment is voided (soft-deleted + reversed).
 *
 * Triggers:
 *  - PaymentService::void()
 *
 * Listeners:
 *  - ReversePaymentLedger
 *  - LogPaymentActivity
 */
class PaymentVoided implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Payment $payment
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('org.' . $this->payment->org_id),
        ];

        if ($this->payment->property_id) {
            $channels[] = new PrivateChannel('property.' . $this->payment->property_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.voided';
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->payment->id,
            'amount'      => (float) $this->payment->amount,
            'voided_at'   => now()->toIso8601String(),
            'property_id' => $this->payment->property_id,
        ];
    }
}
