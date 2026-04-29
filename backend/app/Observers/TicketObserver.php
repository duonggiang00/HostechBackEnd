<?php

namespace App\Observers;

use App\Events\Ticket\TicketCreated;
use App\Events\Ticket\TicketStatusUpdated;
use App\Models\Contract\ContractMember;
use App\Models\Org\User;
use App\Models\Ticket\Ticket;
use App\Notifications\Ticket\NewTicketNotification;
use App\Services\Contract\ContractService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class TicketObserver
{
    /**
     * Handle the Ticket "created" event.
     */
    public function created(Ticket $ticket): void
    {
        // 1. Dispatch real-time broadcast event
        TicketCreated::dispatch($ticket);

        // 2. Notify all managers/admins of the organization
        $managers = User::where('org_id', $ticket->org_id)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['Admin', 'Manager']);
            })->get();

        if ($managers->isNotEmpty()) {
            Notification::send($managers, new NewTicketNotification($ticket));
        }
    }

    /**
     * Handle the Ticket "updated" event.
     */
    public function updated(Ticket $ticket): void
    {
        // If status changed, notify the parties
        if ($ticket->wasChanged('status')) {
            TicketStatusUpdated::dispatch($ticket);

            // Notify the tenant (the one who created the ticket)
            $tenant = $ticket->createdBy;
            if ($tenant) {
                // Here you could create/dispatch a TicketStatusChangedNotification for the tenant
                // $tenant->notify(new TicketStatusChangedNotification($ticket));
            }

            // Auto-approve pending ContractMember when ADD_MEMBER ticket is DONE
            if ($ticket->category === 'ADD_MEMBER' && $ticket->status === 'DONE' && $ticket->contract_id) {
                $pendingMembers = ContractMember::where('contract_id', $ticket->contract_id)
                    ->where('status', 'PENDING')
                    ->get();

                if ($pendingMembers->isNotEmpty()) {
                    $contractService = app(ContractService::class);
                    foreach ($pendingMembers as $member) {
                        try {
                            $contractService->approveMember($ticket->contract_id, $member->id);
                        } catch (\Exception $e) {
                            // Log error silently if it fails to approve a member
                            Log::error("Failed to auto-approve member {$member->id}: ".$e->getMessage());
                        }
                    }
                }
            }
        }
    }
}
