<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TerminationFailed implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Contract $contract,
        public string $message,
    ) {}

    public function broadcastOn(): array
    {
        return TerminationBroadcastChannels::forContract($this->contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.termination.failed';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'pipeline_step' => 'failed',
            'message' => $this->message,
        ];
    }
}
