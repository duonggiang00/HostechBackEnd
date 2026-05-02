<?php

namespace App\Jobs\Property;

use App\Services\Property\RoomService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueueAfterCommit;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Sao chép room_assets từ template sau khi sync sơ đồ — tránh N lần insert trong transaction HTTP.
 *
 * @see RoomService::applyTemplateAssetsForOverviewPairs
 */
class ApplyTemplateAssetsAfterOverviewSyncJob implements ShouldQueueAfterCommit
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
        $roomService->applyTemplateAssetsForOverviewPairs($this->pairs);
    }
}
