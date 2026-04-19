<?php

namespace App\Events\Billing;

use App\Models\Invoice\Invoice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class InvoiceGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Invoice $invoice
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('property.' . $this->invoice->property_id),
            new PrivateChannel('org.' . $this->invoice->org_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'invoice.generated';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id'           => $this->invoice->id,
            'contract_id'  => $this->invoice->contract_id,
            'room_id'      => $this->invoice->room_id,
            'period_start' => $this->invoice->period_start,
            'period_end'   => $this->invoice->period_end,
            'total_amount' => $this->invoice->total_amount,
            'status'       => $this->invoice->status,
        ];
    }
}
