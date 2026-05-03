<?php

namespace App\Listeners\Contract\Timeline;

use App\Events\Contract\Termination\SettlementResolved;
use App\Models\Contract\ContractStatusHistory;

/**
 * Ghi milestone giải quyết quyết toán (refund/extra payment) lên timeline.
 *
 * Lưu ý: nếu cùng pipeline còn cập nhật status -> TERMINATED thì observer đã ghi STATUS_CHANGE.
 * Listener này thêm một dòng milestone "đã quyết toán" (kèm refund_receipt_id / settlement_invoice_id)
 * giúp UI hiển thị link tới biên nhận hoàn cọc / hóa đơn quyết toán.
 */
class RecordSettlementResolvedTimeline
{
    public function handle(SettlementResolved $event): void
    {
        ContractStatusHistory::recordEvent(
            $event->contract,
            ContractStatusHistory::EVENT_SETTLEMENT_RESOLVED,
            'Quyết toán thanh lý hoàn tất.',
            payload: [
                'settlement_invoice_id' => $event->settlementInvoice?->id,
                'refund_receipt_id' => $event->refundReceiptId,
                'id' => $event->settlementInvoice?->id ?? $event->refundReceiptId ?? $event->contract->id,
            ],
        );
    }
}
