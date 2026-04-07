<?php

namespace App\Observers;

use App\Models\Property\Floor;
use Illuminate\Support\Facades\Cache;

class FloorObserver
{
    /**
     * Clear Building Overview Cache on any change to floor.
     */
    public function saved(Floor $floor): void
    {
        $this->invalidateCache($floor);
    }

    public function deleted(Floor $floor): void
    {
        $this->invalidateCache($floor);
    }

    public function restored(Floor $floor): void
    {
        $this->invalidateCache($floor);
    }

    /**
     * Xóa cache building overview của tòa nhà chứa tầng này.
     */
    private function invalidateCache(Floor $floor): void
    {
        if ($floor->property_id) {
            Cache::forget("building_overview_{$floor->property_id}");
        }
    }
}
