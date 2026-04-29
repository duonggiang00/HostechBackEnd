<?php

namespace App\Listeners\Meter;

use App\Events\Meter\MeterReadingApproved;
use App\Models\Meter\MeterReading;

class SynchronizeMeterMetadata
{
    /**
     * Handle the event.
     */
    public function handle(MeterReadingApproved $event): void
    {
        $reading = $event->reading;
        $meter = $reading->meter;

        // 1. Update the meter's own base_reading to its latest finalized reading (APPROVED or LOCKED)
        $latest = $meter->readings()
            ->whereIn('status', MeterReading::FINALIZED_STATUSES)
            ->orderBy('period_end', 'desc')
            ->first();
        if ($latest) {
            $meter->update(['base_reading' => $latest->reading_value]);
        }
    }
}
