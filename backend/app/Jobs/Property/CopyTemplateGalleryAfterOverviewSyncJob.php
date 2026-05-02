<?php

namespace App\Jobs\Property;

use App\Services\Property\RoomService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Copy template gallery onto many rooms in one run (after building overview sync).
 * Avoids N separate afterResponse jobs / N template loads.
 *
 * @see RoomService::copyTemplateGalleryForOverviewPairs
 */
class CopyTemplateGalleryAfterOverviewSyncJob implements ShouldQueueAfterCommit
{
    use Dispatchable, InteractsWithQueue, Queueable;

    public int $tries = 3;

    /**
     * @param  list<array{room_id: string, template_id: string}>  $pairs
     */
    public function __construct(
        public array $pairs,
    ) {}

    public function handle(RoomService $roomService): void
    {
        $roomService->copyTemplateGalleryForOverviewPairs($this->pairs);
    }
}
