<?php

namespace App\Notifications\Meter;

use App\Models\Meter\MeterReading;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification: Manager đã từ chối bản ghi chốt số → Staff được thông báo.
 *
 * Recipients: Staff (người submit) → user.{staffId}
 * Channels: database (persistent) + broadcast (real-time toast).
 */
class MeterReadingRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public MeterReading $reading,
        public string $rejectedByName,
        public ?string $reason = null,
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
        $reasonText = $this->reason ? " — Lý do: {$this->reason}" : '';

        return [
            'type' => 'meter_reading_rejected',
            'reading_id' => $this->reading->id,
            'meter_id' => $meter->id,
            'meter_code' => $meter->code,
            'room_code' => $meter->room?->code,
            'property_id' => $meter->property_id,
            'period_end' => $this->reading->period_end?->toDateString(),
            'reading_value' => $this->reading->reading_value,
            'rejected_by' => $this->rejectedByName,
            'reason' => $this->reason,
            'message' => "❌ Chỉ số đồng hồ {$meter->code} (phòng {$meter->room?->code}) kỳ {$this->reading->period_end?->format('d/m/Y')} bị từ chối bởi {$this->rejectedByName}{$reasonText}.",
        ];
    }

    /**
     * Broadcast notification payload.
     */
    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

}
