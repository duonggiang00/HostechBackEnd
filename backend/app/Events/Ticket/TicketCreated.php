<?php

namespace App\Events\Ticket;

use App\Models\Ticket\Ticket;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TicketCreated implements ShouldBroadcast
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
        // Broadcast to the whole organization so managers/admins see it
        return [
            new PrivateChannel('org.' . $this->ticket->org_id),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ticket.created';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id'                 => $this->ticket->id,
            'property_id'        => $this->ticket->property_id,
            'room_code'          => $this->ticket->room?->code,
            'category'           => $this->ticket->category,
            'priority'           => $this->ticket->priority,
            'status'             => $this->ticket->status,
            'description'        => \Illuminate\Support\Str::limit($this->ticket->description, 100),
            'created_by_user_id' => $this->ticket->created_by_user_id,
            'created_at'         => $this->ticket->created_at->toIso8601String(),
        ];
    }
}
