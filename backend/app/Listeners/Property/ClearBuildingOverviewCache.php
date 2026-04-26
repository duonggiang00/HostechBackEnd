<?php

namespace App\Listeners\Property;

use App\Events\Property\RoomCreated;
use App\Events\Property\RoomUpdated;
use App\Events\Property\RoomDeleted;
use App\Events\Property\FloorCreated;
use App\Events\Property\FloorUpdated;
use App\Events\Property\FloorDeleted;
use App\Events\Property\PropertyCreated;
use App\Events\Property\PropertyUpdated;
use App\Events\Property\BuildingOverviewUpdated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;

class ClearBuildingOverviewCache implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(mixed $event): void
    {
        $propertyId = $this->getPropertyIdFromEvent($event);
        
        if (!$propertyId) {
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
            
            if (!$hasImpact) {
                return;
            }
        }

        // --- CLEAR CACHE ---
        Cache::forget("building_overview_{$propertyId}");
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
