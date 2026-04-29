<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TerminationInitiated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Contract $contract,
        public array $payload = [],
    ) {}

    public function broadcastOn(): array
    {
        return TerminationBroadcastChannels::forContract($this->contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.termination.initiated';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'pipeline_step' => 'initiated',
            'message' => 'Đã bắt đầu pipeline thanh lý hợp đồng.',
        ];
    }
}
