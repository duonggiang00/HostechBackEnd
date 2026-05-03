<?php

namespace App\Listeners\Contract\Timeline;

use App\Events\Contract\ContractSignatureConfirmed;
use App\Models\Contract\ContractStatusHistory;

/**
 * Ghi mốc "đã ký" lên timeline (không thay đổi status).
 */
class RecordSignatureTimeline
{
    public function handle(ContractSignatureConfirmed $event): void
    {
        $contract = $event->contract;
        $role = strtolower($event->role);

        $eventType = $role === 'manager'
            ? ContractStatusHistory::EVENT_SIGNATURE_MANAGER
            : ContractStatusHistory::EVENT_SIGNATURE_TENANT;

        $note = $role === 'manager'
            ? 'Quản lý đã ký xác nhận hợp đồng.'
            : 'Khách thuê đã ký xác nhận hợp đồng.';

        ContractStatusHistory::recordEvent(
            $contract,
            $eventType,
            $note,
            payload: [
                'role' => $role,
            ],
        );
    }
}
