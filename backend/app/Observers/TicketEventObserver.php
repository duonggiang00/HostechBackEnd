<?php

namespace App\Observers;

use App\Events\Ticket\TicketCommentAdded;
use App\Models\Ticket\TicketEvent;

class TicketEventObserver
{
    /**
     * Broadcast realtime khi có comment mới được gửi vào ticket.
     */
    public function created(TicketEvent $ticketEvent): void
    {
        if ($ticketEvent->type !== 'COMMENT') {
            return;
        }

        $ticket = $ticketEvent->ticket()->with('room')->first();
        if (! $ticket) {
            return;
        }

        TicketCommentAdded::dispatch($ticketEvent, $ticket);
    }
}
