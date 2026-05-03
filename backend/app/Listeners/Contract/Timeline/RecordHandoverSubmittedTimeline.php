<?php

namespace App\Listeners\Contract\Timeline;

use App\Events\Contract\Termination\HandoverSubmitted;
use App\Models\Contract\ContractStatusHistory;

class RecordHandoverSubmittedTimeline
{
    public function handle(HandoverSubmitted $event): void
    {
        $handover = $event->handover;
        $contract = $event->contract;

        ContractStatusHistory::recordEvent(
            $contract,
            ContractStatusHistory::EVENT_HANDOVER_SUBMITTED,
            'Đã hoàn tất biên bản bàn giao trả phòng và sẵn sàng phát hành hóa đơn thanh lý.',
            payload: [
                'handover_id' => $handover->id,
                'id' => $handover->id,
            ],
        );
    }
}
