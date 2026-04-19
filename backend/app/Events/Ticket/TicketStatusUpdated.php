<?php

namespace App\Events\Ticket;

use App\Models\Ticket\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketStatusUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Ticket $ticket
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast to:
        // 1. The manager (Org channel)
        // 2. The tenant (Personal channel)
        return [
            new PrivateChannel('org.' . $this->ticket->org_id),
            new PrivateChannel('App.Models.Org.User.' . $this->ticket->created_by_user_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ticket.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id'          => $this->ticket->id,
            'status'      => $this->ticket->status,
            'updated_at'  => $this->ticket->updated_at->toIso8601String(),
        ];
    }
}
