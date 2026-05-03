<?php

namespace App\Events\Contract;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ContractRenewalRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $contractId,
        public string $propertyId,
        public string $orgId,
        public string $requestedByUserId,
        public string $requestedEndDate,
        public string $requestedAt,
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('property.'.$this->propertyId),
            new PrivateChannel('org.'.$this->orgId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'contract.renewal_requested';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contractId,
            'property_id' => $this->propertyId,
            'org_id' => $this->orgId,
            'requested_by_user_id' => $this->requestedByUserId,
            'requested_end_date' => $this->requestedEndDate,
            'requested_at' => $this->requestedAt,
        ];
    }
}
