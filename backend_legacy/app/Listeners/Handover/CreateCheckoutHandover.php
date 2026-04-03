<?php

namespace App\Listeners\Handover;

use App\Events\Contract\ContractTerminated;
use App\Services\Handover\HandoverService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateCheckoutHandover
{
    public function __construct(private HandoverService $handoverService)
    {
    }

    public function handle(ContractTerminated $event): void
    {
        $contract = $event->contract;
        
        if (!$contract->room_id || !$contract->org) {
            return;
        }

        $this->handoverService->createDraft($contract->org, [
            'type' => 'CHECKOUT',
            'contract_id' => $contract->id,
            'room_id' => $contract->room_id,
            'note' => 'Tự động tạo biên bản bàn giao (Trả phòng) khi hợp đồng thanh lý.',
        ]);
    }
}
