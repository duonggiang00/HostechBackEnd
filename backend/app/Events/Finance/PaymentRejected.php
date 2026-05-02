<?php

namespace App\Events\Finance;

use App\Models\Finance\Payment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a tenant's manual payment proof is rejected by a manager/staff.
 *
 * Broadcasts to the payer's personal channel so the tenant's UI can
 * invalidate its payment/invoice queries and show a toast notification.
 */
class PaymentRejected implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Payment $payment
    ) {}

    public function broadcastOn(): array
    {
        $channels = [];

        // Notify the payer (tenant) directly.
        if ($this->payment->payer_user_id) {
            $channels[] = new PrivateChannel('user.'.$this->payment->payer_user_id);
        }

        // Also broadcast on the property channel so manager's list auto-refreshes.
        if ($this->payment->property_id) {
            $channels[] = new PrivateChannel('property.'.$this->payment->property_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'payment.rejected';
    }

    public function broadcastWith(): array
    {
        $reason = $this->payment->meta['reject_reason'] ?? null;

        return [
            'payment_id' => $this->payment->id,
            'amount' => (float) $this->payment->amount,
            'method' => $this->payment->method,
            'payer_user_id' => $this->payment->payer_user_id,
            'property_id' => $this->payment->property_id,
            'reject_reason' => $reason,
            'rejected_at' => $this->payment->meta['rejected_at'] ?? now()->toIso8601String(),
        ];
    }
}
