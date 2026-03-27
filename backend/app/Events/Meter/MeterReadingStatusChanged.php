<?php

namespace App\Events\Meter;

use App\Models\Meter\MeterReading;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeterReadingStatusChanged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public function __construct(public MeterReading $reading)
    {
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('property.' . $this->reading->meter->property_id),
            new PrivateChannel('user.' . $this->reading->submitted_by_user_id),
        ];
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
            'status' => $this->reading->status,
            'meter_code' => $this->reading->meter->code,
            'period_end' => $this->reading->period_end?->format('Y-m-d'),
            'message' => "Chỉ số đồng hồ {$this->reading->meter->code} cho kỳ kết thúc ngày {$this->reading->period_end?->format('d/m/Y')} đã được chuyển sang trạng thái {$this->reading->status}.",
        ];
    }
}
