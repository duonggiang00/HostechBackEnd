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

        // Cho phép luồng "issue-only" (manager xác nhận từng giai đoạn trên wizard) bỏ qua auto reconcile.
        $snapshot = is_array($invoice->snapshot) ? $invoice->snapshot : [];
        if (array_key_exists('auto_reconcile', $snapshot) && $snapshot['auto_reconcile'] === false) {
            return;
        }

        event(new DebtReconciliationTriggered($contract->fresh(), $invoice));
    }
}
