<?php

namespace App\Events\Finance;

use App\Models\Finance\Receipt;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dispatched after a receipt PDF is successfully generated and stored.
 *
 * Broadcast đến:
 * - user.{payer_user_id}          → tenant nhận thông báo biên lai sẵn sàng
 * - property.{property_id}        → manager/staff cùng tòa nhà
 */
class ReceiptGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Receipt $receipt
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];

        $payment = $this->receipt->payment;

        if ($payment?->payer_user_id) {
            $channels[] = new PrivateChannel('user.'.$payment->payer_user_id);
        }

        if ($payment?->property_id) {
            $channels[] = new PrivateChannel('property.'.$payment->property_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'receipt.generated';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        $payment = $this->receipt->payment;

        return [
            'receipt_id' => $this->receipt->id,
            'kind' => $this->receipt->kind,
            'payment_id' => $this->receipt->payment_id,
            'property_id' => $payment?->property_id,
            'payer_user_id' => $payment?->payer_user_id,
            'amount' => $payment?->amount,
        ];
    }
}
