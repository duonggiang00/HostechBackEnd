<?php

namespace App\Listeners\Contract\Timeline;

use App\Events\Contract\Termination\SettlementPaymentRequired;
use App\Models\Contract\ContractStatusHistory;

class RecordSettlementPaymentRequiredTimeline
{
    public function handle(SettlementPaymentRequired $event): void
    {
        $fpr = $event->finalPaymentRequest;

        ContractStatusHistory::recordEvent(
            $event->contract,
            ContractStatusHistory::EVENT_SETTLEMENT_PAYMENT_REQUESTED,
            'Đã sinh yêu cầu thanh toán nốt sau khi cấn trừ cọc.',
            payload: [
                'final_payment_request_id' => $fpr->id,
                'amount_due' => (string) $fpr->amount_due,
                'invoice_id' => $fpr->invoice_id,
                'id' => $fpr->id,
            ],
        );
    }
}
