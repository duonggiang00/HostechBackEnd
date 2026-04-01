<?php

namespace App\Listeners\Handover;

use App\Events\Contract\ContractActivated;
use App\Services\Handover\HandoverService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateCheckinHandover
{
    public function __construct(private HandoverService $handoverService)
    {
    }

    public function handle(ContractActivated $event): void
    {
        $contract = $event->contract;
        
        if (!$contract->room_id || !$contract->org) {
            return;
        }

        $this->handoverService->createDraft($contract->org, [
            'type' => 'CHECKIN',
            'contract_id' => $contract->id,
            'room_id' => $contract->room_id,
            'note' => 'Tự động tạo biên bản bàn giao (Nhận phòng) khi hợp đồng kích hoạt.',
        ]);
    }
}
