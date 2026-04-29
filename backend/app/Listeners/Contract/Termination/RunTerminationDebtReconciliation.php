<?php

namespace App\Listeners\Contract\Termination;

use App\Events\Contract\Termination\DebtReconciliationTriggered;
use App\Services\Contract\Termination\TerminationReconciliationService;

class RunTerminationDebtReconciliation
{
    public function __construct(
        protected TerminationReconciliationService $reconciliationService,
    ) {}

    public function handle(DebtReconciliationTriggered $event): void
    {
        // Tránh quyết toán FIFO trùng lần trong cùng request.
        $guardKey = 'termination.pipeline.reconcile.'.$event->finalInvoice->id;
        if (app()->bound($guardKey)) {
            return;
        }
        app()->instance($guardKey, true);

        $this->reconciliationService->reconcile(
            $event->contract->fresh(),
            $event->finalInvoice->fresh()
        );
    }
}
