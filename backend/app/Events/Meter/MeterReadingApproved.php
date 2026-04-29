<?php

namespace App\Events\Meter;

use App\Enums\ContractStatus;
use App\Models\Meter\MeterReading;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeterReadingApproved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public MeterReading $reading
    ) {}

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        $channels = [
            new PrivateChannel('property.'.$this->reading->meter->property_id),
            new PrivateChannel('org.'.$this->reading->org_id),
        ];

        // Broadcast to tenants of the room to trigger real-time UI refresh
        $room = $this->reading->meter->room;
        if ($room) {
            $tenantIds = $room->contracts()
                ->whereIn('status', [ContractStatus::ACTIVE, ContractStatus::PENDING_TERMINATION])
                ->get()
                ->flatMap(fn ($contract) => $contract->members()->where('status', 'APPROVED')->pluck('user_id'))
                ->unique()
                ->filter();

            foreach ($tenantIds as $userId) {
                $channels[] = new PrivateChannel('App.Models.User.'.$userId);
            }
        }

        return $channels;
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'meter-reading.approved';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->reading->id,
            'meter_id' => $this->reading->meter_id,
            'reading_value' => $this->reading->reading_value,
            'consumption' => $this->reading->consumption,
            'period_end' => $this->reading->period_end,
            'status' => $this->reading->status,
        ];
    }
}
