<?php

namespace App\Events\Finance;

use App\Models\Finance\Payment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a tenant submits a manual payment proof (CASH / BANK_TRANSFER).
 *
 * Broadcasts to the property channel so the manager's verification list
 * auto-refreshes without requiring a manual page reload.
 */
class PaymentProofSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Payment $payment
    ) {}

    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('org.'.$this->payment->org_id),
        ];

        if ($this->payment->property_id) {
            $channels[] = new PrivateChannel('property.'.$this->payment->property_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.proof_submitted';
    }

    public function broadcastWith(): array
    {
        return [
            'payment_id' => $this->payment->id,
            'amount' => (float) $this->payment->amount,
            'method' => $this->payment->method,
            'payer_user_id' => $this->payment->payer_user_id,
            'property_id' => $this->payment->property_id,
            'org_id' => $this->payment->org_id,
            'submitted_at' => $this->payment->meta['submitted_at'] ?? now()->toIso8601String(),
        ];
    }
}
