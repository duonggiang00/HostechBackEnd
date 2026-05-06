<?php

namespace App\Events\Ticket;

use App\Models\Ticket\Ticket;
use App\Models\Ticket\TicketEvent;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;

class TicketCommentAdded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly TicketEvent $ticketEvent,
        public readonly Ticket $ticket,
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            // Staff / Manager của tổ chức
            new PrivateChannel('org.'.$this->ticket->org_id),
        ];

        // Tenant (người tạo ticket) — nhận realtime khi staff trả lời
        if (
            $this->ticket->created_by_user_id
            && (string) $this->ticket->created_by_user_id !== (string) $this->ticketEvent->actor_user_id
        ) {
            $channels[] = new PrivateChannel('App.Models.Org.User.'.$this->ticket->created_by_user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'ticket.comment_added';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'ticket_id' => $this->ticket->id,
            'property_id' => $this->ticket->property_id,
            'event_id' => $this->ticketEvent->id,
            'actor_user_id' => $this->ticketEvent->actor_user_id,
            'message' => Str::limit($this->ticketEvent->message ?? '', 120),
            'created_at' => $this->ticketEvent->created_at?->toIso8601String(),
        ];
    }
}
