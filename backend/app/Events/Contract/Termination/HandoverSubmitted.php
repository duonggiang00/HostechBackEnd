<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use App\Models\Handover\Handover;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Được bắn sau khi biên bản bàn giao đã CONFIRMED và đủ điều kiện thanh lý (EDA).
 */
class HandoverSubmitted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Handover $handover,
        public Contract $contract,
        public array $terminatePayload = [],
    ) {}

    public function broadcastOn(): array
    {
        return TerminationBroadcastChannels::forContract($this->contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.termination.handover_submitted';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'handover_id' => $this->handover->id,
            'pipeline_step' => 'handover_submitted',
            'message' => 'Đang tạo hóa đơn thanh lý cuối từ biên bản bàn giao.',
        ];
    }
}
