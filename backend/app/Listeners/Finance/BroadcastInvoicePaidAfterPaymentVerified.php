<?php

namespace App\Listeners\Finance;

use App\Events\Finance\InvoicePaidEvent;
use App\Events\Finance\PaymentSuccessfullyVerified;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * After a payment is verified, notify clients for each invoice that reached PAID.
 */
class BroadcastInvoicePaidAfterPaymentVerified implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'finance';

    public function handle(PaymentSuccessfullyVerified $event): void
    {
        $payment = $event->payment->loadMissing('allocations.invoice');

        $seen = [];
        foreach ($payment->allocations as $alloc) {
            $invoice = $alloc->invoice;
            if (! $invoice || $invoice->status !== 'PAID') {
                continue;
            }
            if (isset($seen[$invoice->id])) {
                continue;
            }
            $seen[$invoice->id] = true;

            InvoicePaidEvent::dispatch($invoice->fresh(), $payment->id);
        }
    }
}
