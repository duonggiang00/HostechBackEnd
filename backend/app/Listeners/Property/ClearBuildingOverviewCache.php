<?php

namespace App\Listeners\Property;

use App\Events\Property\BuildingOverviewUpdated;
use Illuminate\Support\Facades\Cache;

class ClearBuildingOverviewCache
{
    public function handle(BuildingOverviewUpdated $event): void
    {
        Cache::forget("building_overview_{$event->propertyId}");
    }
}
