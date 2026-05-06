<?php

namespace App\Listeners\Property;

use App\Events\Property\RoomUpdated;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Request;

/**
 * Xóa cache mặt bằng tòa nhà — chạy đồng bộ để GET /overview không trả dữ liệu cũ
 * trong khi worker queue chưa xử lý (trước đây ShouldQueueAfterCommit gây trễ UI).
 */
class ClearBuildingOverviewCache
{
    /**
     * Handle the event.
     */
    public function handle(mixed $event): void
    {
        $propertyId = $this->getPropertyIdFromEvent($event);

        if (! $propertyId) {
            return;
        }

        // --- OPTIMIZATION: FIELD-AWARE CACHE BUSTING ---
        // For RoomUpdated, only clear cache if layout-impacting fields changed
        if ($event instanceof RoomUpdated) {
            $changes = $event->changes ?? [];
            $layoutFields = ['status', 'code', 'name', 'floor_id', 'position', 'is_active'];
            $hasImpact = false;

            foreach ($layoutFields as $field) {
                if (array_key_exists($field, $changes)) {
                    $hasImpact = true;
                    break;
                }
            }

            if (! $hasImpact) {
                return;
            }
        }

        if (! $this->shouldBustBuildingOverviewNow($propertyId)) {
            return;
        }

        Cache::forget("building_overview_{$propertyId}");
    }

    /**
     * Trong một HTTP request (QUEUE_CONNECTION=sync), nhiều RoomCreated có thể bust cùng một key — chỉ forget một lần.
     * Trong queue worker (database/redis), luôn bust để tránh bỏ sót giữa các request.
     */
    private function shouldBustBuildingOverviewNow(string $propertyId): bool
    {
        if (app()->runningInConsole()) {
            return true;
        }

        $request = request();
        if (! $request instanceof Request) {
            return true;
        }

        $flag = '_building_overview_bust_'.$propertyId;
        if ($request->attributes->get($flag)) {
            return false;
        }
        $request->attributes->set($flag, true);

        return true;
    }

    /**
     * Resolve Property ID from various event types.
     */
    protected function getPropertyIdFromEvent(mixed $event): ?string
    {
        if (isset($event->propertyId)) {
            return $event->propertyId;
        }

        if (isset($event->room) && isset($event->room->property_id)) {
            return $event->room->property_id;
        }

        if (isset($event->floor) && isset($event->floor->property_id)) {
            return $event->floor->property_id;
        }

        if (isset($event->property) && isset($event->property->id)) {
            return $event->property->id;
        }

        return null;
    }
}
