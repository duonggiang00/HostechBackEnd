<?php

namespace App\Notifications\Ticket;

use App\Models\Ticket\Ticket;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class NewTicketNotification extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public readonly Ticket $ticket
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'        => 'ticket.created',
            'ticket_id'   => $this->ticket->id,
            'room_code'   => $this->ticket->room?->code,
            'category'    => $this->ticket->category,
            'priority'    => $this->ticket->priority,
            'message'     => "Yêu cầu bảo trì mới tại phòng {$this->ticket->room?->code}: {$this->ticket->category}",
            'action_url'  => "/tickets/{$this->ticket->id}",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
