<?php

namespace App\Listeners\Property;

use App\Events\Meter\MeterReadingCreated;

class NotifyPropertyManagers
{
    /**
     * Handle the event.
     */
    public function handle(MeterReadingCreated $event): void
    {
        // Placeholder for future notification logic
        // This listener ensures that property managers are alerted when new meter readings are submitted
    }
}
