<?php

namespace App\Listeners\Contract\Termination;

use App\Events\Contract\Termination\DebtReconciliationTriggered;
use App\Events\Contract\Termination\FinalInvoiceGenerated;

class DispatchDebtReconciliation
{
    public function handle(FinalInvoiceGenerated $event): void
    {
        $invoice = $event->invoice->loadMissing('contract');
        $contract = $invoice->contract;
        if (! $contract) {
            return;
        }

        event(new DebtReconciliationTriggered($contract->fresh(), $invoice));
    }
}
