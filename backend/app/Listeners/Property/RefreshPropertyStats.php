<?php

namespace App\Listeners\Property;

use App\Events\Property\RoomCreated;
use App\Events\Property\RoomDeleted;
use App\Events\Property\RoomUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

/**
 * Listener to refresh property stats reactively when rooms change.
 * Implementation implements ShouldQueue for background processing.
 */
class RefreshPropertyStats implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct()
    {
    }

    /**
     * Handle the event.
     */
    public function handle(object $event): void
    {
        $room = $event->room;
        $property = $room->property;

        if (!$property) {
            return;
        }

        // --- DECOUPLED: CACHE BUSTING ---
        // Busting property-level caches
        \Illuminate\Support\Facades\Cache::forget("property_detail_{$property->id}");
        \Illuminate\Support\Facades\Cache::forget("property_stats_{$property->id}");
        
        if ($room->floor_id) {
            \Illuminate\Support\Facades\Cache::forget("floor_detail_{$room->floor_id}");
        }

        \Illuminate\Support\Facades\Log::info("Busted cache for Property {$property->id} and Floor {$room->floor_id} due to room change.");
        // --------------------------------
    }
}
