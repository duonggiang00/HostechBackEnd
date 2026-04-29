<?php

namespace App\Events\Finance;

use App\Models\Finance\Payment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired once a payment is fully verified (APPROVED): manual staff approval or VNPay IPN.
 *
 * Single domain event for ledger, official receipt generation, activity log, and invoice broadcasts.
 */
class PaymentSuccessfullyVerified implements ShouldBroadcast
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
        return 'payment.successfully_verified';
    }

    public function broadcastWith(): array
    {
        return [
            'payment_id' => $this->payment->id,
            'amount' => (float) $this->payment->amount,
            'method' => $this->payment->method,
            'reference' => $this->payment->reference,
            'received_at' => $this->payment->received_at?->toIso8601String(),
            'property_id' => $this->payment->property_id,
            'payer_user_id' => $this->payment->payer_user_id,
        ];
    }
}
