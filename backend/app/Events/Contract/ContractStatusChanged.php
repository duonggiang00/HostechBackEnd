<?php

namespace App\Events\Contract;

use App\Models\Contract\Contract;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Broadcast khi hợp đồng chuyển sang các trạng thái chưa có event riêng:
 * PENDING_SIGNATURE, PENDING_TERMINATION, TERMINATED, EXPIRED, CANCELLED, PENDING_SETTLEMENT.
 *
 * Kênh:
 * - property.{property_id}          → manager / staff cùng tòa nhà
 * - App.Models.Org.User.{tenant_id} → tenant chính của hợp đồng
 */
class ContractStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Contract $contract,
        public readonly string $fromStatus,
        public readonly string $toStatus,
    ) {}

    /**
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [];

        if ($this->contract->property_id) {
            $channels[] = new PrivateChannel('property.'.$this->contract->property_id);
        }

        // Tenant chính — nhận thông báo khi manager đổi trạng thái HĐ
        $primaryTenant = $this->contract->members()
            ->where('is_primary', true)
            ->whereNotNull('user_id')
            ->first();

        if ($primaryTenant) {
            $channels[] = new PrivateChannel('App.Models.Org.User.'.$primaryTenant->user_id);
        }

        return $channels;
    }

    public function broadcastAs(): string
    {
        return 'contract.status_changed';
    }

    /**
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'room_code' => $this->contract->room?->code,
            'from_status' => $this->fromStatus,
            'to_status' => $this->toStatus,
        ];
    }
}
