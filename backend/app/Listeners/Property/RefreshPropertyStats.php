<?php

namespace App\Listeners\Property;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Listener to refresh property stats reactively when rooms change.
 * Implementation implements ShouldQueue for background processing.
 */
class RefreshPropertyStats implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct() {}

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $property = null;
        $floorId = null;

        if (isset($event->room)) {
            $property = $event->room->property;
            $floorId = $event->room->floor_id;
        } elseif (isset($event->floor)) {
            $property = $event->floor->property;
            $floorId = $event->floor->id;
        } elseif (isset($event->property)) {
            $property = $event->property;
        }

        if (! $property) {
            return;
        }

        // --- DECOUPLED: CACHE BUSTING ---
        // Busting property-level caches
        Cache::forget("property_detail_{$property->id}");
        Cache::forget("property_stats_{$property->id}");

        if ($floorId) {
            Cache::forget("floor_detail_{$floorId}");
        }

        Log::info("Busted cache for Property {$property->id} due to system update.");
        // --------------------------------
    }
}
