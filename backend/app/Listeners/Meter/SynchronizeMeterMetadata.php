<?php

namespace App\Listeners\Meter;

use App\Events\Meter\MeterReadingApproved;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SynchronizeMeterMetadata
{
    /**
     * Handle the event.
     */
    public function handle(MeterReadingApproved $event): void
    {
        $reading = $event->reading;
        $meter = $reading->meter;

        // 1. Update the meter's own base_reading to its latest approved reading
        // We fetch fresh to ensure we have the absolute latest state
        $latest = $meter->readings()->where('status', 'APPROVED')->orderBy('period_end', 'desc')->first();
        if ($latest) {
            $meter->update(['base_reading' => $latest->reading_value]);
        }
    }
}
