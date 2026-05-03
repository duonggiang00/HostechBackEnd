<?php

namespace App\Listeners\Contract\Timeline;

use App\Events\Contract\Termination\DebtReconciliationTriggered;
use App\Models\Contract\ContractStatusHistory;

class RecordDebtReconciliationTimeline
{
    public function handle(DebtReconciliationTriggered $event): void
    {
        ContractStatusHistory::recordEvent(
            $event->contract,
            ContractStatusHistory::EVENT_DEBT_RECONCILIATION,
            'Bắt đầu cấn trừ tiền cọc theo FIFO với các hóa đơn còn nợ.',
            payload: [
                'final_invoice_id' => $event->finalInvoice->id,
                'id' => $event->finalInvoice->id,
            ],
        );
    }
}
