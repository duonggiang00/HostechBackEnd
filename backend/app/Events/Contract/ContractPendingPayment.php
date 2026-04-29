<?php

namespace App\Events\Contract;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a Contract transitions to PENDING_PAYMENT status.
 */
class ContractPendingPayment implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Contract $contract
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('App.Models.Org.User.'.$this->contract->created_by_user_id),
        ];

        // Also notify the primary tenant if they have a user account
        $primaryTenant = $this->contract->members()
            ->where('is_primary', true)
            ->whereNotNull('user_id')
            ->first();

        if ($primaryTenant) {
            $channels[] = new PrivateChannel('App.Models.Org.User.'.$primaryTenant->user_id);
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'contract.pending_payment';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->contract->id,
            'status' => 'PENDING_PAYMENT',
            'room_code' => $this->contract->room?->code,
        ];
    }
}
