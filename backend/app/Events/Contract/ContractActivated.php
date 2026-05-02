<?php

namespace App\Events\Contract;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Fired when a Contract transitions to ACTIVE status.
 * Listeners should use this event to perform post-activation tasks,
 * such as snapshotting service prices into contract.meta (Service Lock).
 */
class ContractActivated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Contract $contract
    ) {}

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        $channels = [];

        // Notify the manager/owner who created the contract
        if ($this->contract->created_by_user_id) {
            $channels[] = new PrivateChannel('App.Models.Org.User.'.$this->contract->created_by_user_id);
        }

        // Notify via property channel so all managers on the property get the update
        if ($this->contract->property_id) {
            $channels[] = new PrivateChannel('property.'.$this->contract->property_id);
        }

        // Also notify the primary tenant if they have a user account
        $primaryTenant = $this->contract->members()
            ->where('is_primary', true)
            ->whereNotNull('user_id')
            ->first();

        if ($primaryTenant) {
            $channels[] = new PrivateChannel('App.Models.Org.User.'.$primaryTenant->user_id);
        }

        return array_values(array_filter($channels));
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'contract.activated';
    }
}
