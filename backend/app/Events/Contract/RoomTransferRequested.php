<?php

namespace App\Events\Contract;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Tenant gửi yêu cầu đổi phòng — broadcast để Property scope / Org refresh hàng chờ realtime.
 */
class RoomTransferRequested implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $contractId,
        public string $propertyId,
        public string $orgId,
        public string $requestedByUserId,
        public ?string $toRoomId,
        public string $requestedAt,
    ) {}

    /**
     * @return array<int, PrivateChannel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('property.'.$this->propertyId),
            new PrivateChannel('org.'.$this->orgId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'room_transfer.requested';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contractId,
            'property_id' => $this->propertyId,
            'org_id' => $this->orgId,
            'requested_by_user_id' => $this->requestedByUserId,
            'to_room_id' => $this->toRoomId,
            'requested_at' => $this->requestedAt,
        ];
    }
}
