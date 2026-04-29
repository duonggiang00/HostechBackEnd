<?php

namespace App\Listeners\Meter;

use App\Events\Meter\BulkMeterReadingsApproved;
use App\Events\Meter\MeterReadingApproved;
use App\Events\Meter\MeterReadingCreated;
use App\Models\Meter\MeterReading;
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
        // 1. Single reading event (MeterReadingApproved, MeterReadingCreated)
        if (isset($event->reading)) {
            $reading = $event->reading;
            $status = $reading->status ?? 'SUBMITTED';
            $this->notificationService->notifyMeterReadingStatusChanged($reading, $status);

            return;
        }

        // 2. Bulk readings event (BulkMeterReadingsApproved)
        if ($event instanceof BulkMeterReadingsApproved) {
            $readingIds = $event->readingIds;
            if (empty($readingIds)) {
                return;
            }

            // Load all readings with necessary relations for notification resolution
            $readings = MeterReading::whereIn('id', $readingIds)->get();

            foreach ($readings as $reading) {
                // Bulk event currently only fires for APPROVED status
                $this->notificationService->notifyMeterReadingStatusChanged($reading, 'APPROVED');
            }
        }
    }
}
