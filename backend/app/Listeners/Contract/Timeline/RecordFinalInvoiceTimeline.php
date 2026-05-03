<?php

namespace App\Listeners\Contract\Timeline;

use App\Events\Contract\Termination\FinalInvoiceGenerated;
use App\Models\Contract\ContractStatusHistory;

class RecordFinalInvoiceTimeline
{
    public function handle(FinalInvoiceGenerated $event): void
    {
        $invoice = $event->invoice;
        $invoice->loadMissing('contract');
        $contract = $invoice->contract;
        if (! $contract) {
            return;
        }

        $snapshot = $invoice->snapshot ?? [];
        $billingMode = $snapshot['termination']['billing_mode']
            ?? $snapshot['billing_mode']
            ?? null;

        ContractStatusHistory::recordEvent(
            $contract,
            ContractStatusHistory::EVENT_FINAL_INVOICE_GENERATED,
            'Đã phát hành hóa đơn thanh lý cuối.',
            payload: [
                'invoice_id' => $invoice->id,
                'total_amount' => (string) ($invoice->total_amount ?? 0),
                'billing_mode' => $billingMode,
                'id' => $invoice->id,
            ],
        );
    }
}
