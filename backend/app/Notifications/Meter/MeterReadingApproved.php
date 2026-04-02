<?php

namespace App\Notifications\Meter;

use App\Features\Meter\Models\MeterReading;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification: Manager đã duyệt bản ghi chốt số → Staff + Tenant được thông báo.
 *
 * Recipients:
 *   - Staff (người submit) → user.{staffId}
 *   - Tenant (người thuê phòng) → user.{tenantId}
 * Channels: database (persistent) + broadcast (real-time toast).
 */
class MeterReadingApproved extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public MeterReading $reading,
        public string $approvedByName,
    ) {}

    /**
     * Notification channels.
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Database notification payload.
     */
    public function toArray(object $notifiable): array
    {
        $meter = $this->reading->meter;

        return [
            'type' => 'meter_reading_approved',
            'reading_id' => $this->reading->id,
            'meter_id' => $meter->id,
            'meter_code' => $meter->code,
            'room_code' => $meter->room?->code,
            'property_id' => $meter->property_id,
            'period_end' => $this->reading->period_end?->toDateString(),
            'reading_value' => $this->reading->reading_value,
            'consumption' => $this->reading->consumption,
            'approved_by' => $this->approvedByName,
            'message' => "✅ Chỉ số đồng hồ {$meter->code} (phòng {$meter->room?->code}) kỳ {$this->reading->period_end?->format('d/m/Y')} đã được duyệt. Tiêu thụ: {$this->reading->consumption}.",
        ];
    }

    /**
     * Broadcast notification payload.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    /**
     * Broadcast on user channel (personal notification).
     */
    public function broadcastOn(): array
    {
        return [
            new \Illuminate\Broadcasting\PrivateChannel("user.{$this->reading->submitted_by_user_id}"),
        ];
    }
}
