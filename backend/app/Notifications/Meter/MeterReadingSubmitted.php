<?php

namespace App\Notifications\Meter;

use App\Features\Meter\Models\MeterReading;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification: Staff đã gửi bản ghi chốt số mới → Manager cần duyệt.
 *
 * Recipients: Manager(s) quản lý property đó.
 * Channels: database (persistent) + broadcast (real-time toast).
 * Broadcast channel: property.{propertyId}
 */
class MeterReadingSubmitted extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public MeterReading $reading,
        public string $submittedByName,
    ) {}

    /**
     * Notification channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Database notification payload (stored in `notifications` table).
     */
    public function toArray(object $notifiable): array
    {
        $meter = $this->reading->meter;

        return [
            'type' => 'meter_reading_submitted',
            'reading_id' => $this->reading->id,
            'meter_id' => $meter->id,
            'meter_code' => $meter->code,
            'room_code' => $meter->room?->code,
            'property_id' => $meter->property_id,
            'period_end' => $this->reading->period_end?->toDateString(),
            'reading_value' => $this->reading->reading_value,
            'submitted_by' => $this->submittedByName,
            'message' => "📝 {$this->submittedByName} đã ghi chỉ số đồng hồ {$meter->code} (phòng {$meter->room?->code}) — Chờ duyệt.",
        ];
    }

    /**
     * Broadcast notification payload (real-time via WebSocket).
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Broadcast on property channel so all Managers of this property receive it.
     */
    public function broadcastOn(): array
    {
        $propertyId = $this->reading->meter->property_id;

        return [
            new \Illuminate\Broadcasting\PrivateChannel("property.{$propertyId}"),
        ];
    }
}
