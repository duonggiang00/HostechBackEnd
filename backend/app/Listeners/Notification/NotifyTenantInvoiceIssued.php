<?php

namespace App\Listeners\Notification;

use App\Events\Billing\InvoiceGenerated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Notifies the tenant when a new invoice has been issued.
 *
 * This listener runs asynchronously via the queue. It can be extended
 * to send email, push notification, or Zalo OA messages.
 */
class NotifyTenantInvoiceIssued implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The queue to use.
     */
    public string $queue = 'notifications';

    /**
     * Handle the event.
     */
    public function handle(InvoiceGenerated $event): void
    {
        $invoice  = $event->invoice;
        $contract = $invoice->contract;

        if (! $contract) {
            return;
        }

        // Load tenant members via contract
        $tenantUsers = $contract->members()
            ->with('user')
            ->get()
            ->pluck('user')
            ->filter();

        if ($tenantUsers->isEmpty()) {
            Log::info('[Notification] No tenant users found for invoice', [
                'invoice_id'  => $invoice->id,
                'contract_id' => $contract->id,
            ]);
            return;
        }

        foreach ($tenantUsers as $user) {
            Log::info('[Notification] [TODO] Send invoice notification to tenant', [
                'invoice_id' => $invoice->id,
                'user_id'    => $user->id,
                'email'      => $user->email,
                'amount'     => $invoice->total_amount,
            ]);

            // TODO: Integrate with mail/push/Zalo notification driver
            // Example:
            // Mail::to($user->email)->queue(new InvoiceIssuedMail($invoice, $user));
            // Notification::send($user, new InvoiceIssuedNotification($invoice));
        }
    }
}
