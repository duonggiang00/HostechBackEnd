<?php

namespace App\Listeners\Meter;

use App\Events\Meter\MeterReadingApproved;
use App\Events\Meter\MeterReadingCreated;
use App\Services\Notification\NotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class DispatchMeterNotifications implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        protected NotificationService $notificationService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $reading = $event->reading;
        
        // We handle both Created and Approved events
        $status = $reading->status ?? 'SUBMITTED';
        
        $this->notificationService->notifyMeterReadingStatusChanged($reading, $status);
    }
}
