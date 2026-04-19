<?php

namespace App\Events\Finance;

use App\Models\Finance\Payment;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a Payment transitions to APPROVED status.
 *
 * Triggers:
 *  - PaymentService::create()        (manual cash/transfer)
 *  - PaymentService::approvePending() (VNPay IPN confirmed)
 *
 * Listeners:
 *  - RecordPaymentLedger
 *  - NotifyTenantPaymentReceived
 *  - LogPaymentActivity
 */
class PaymentApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Payment $payment
    ) {}

    /**
     * Broadcast on the property & org private channels.
     */
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
        return 'payment.approved';
    }

    public function broadcastWith(): array
    {
        return [
            'id'          => $this->payment->id,
            'amount'      => (float) $this->payment->amount,
            'method'      => $this->payment->method,
            'reference'   => $this->payment->reference,
            'received_at' => $this->payment->received_at?->toIso8601String(),
            'property_id' => $this->payment->property_id,
            'payer_user_id' => $this->payment->payer_user_id,
        ];
    }
}
