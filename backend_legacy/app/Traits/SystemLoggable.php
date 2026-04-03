<?php

namespace App\Traits;

use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

trait SystemLoggable
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logAll() // Log all attributes
            ->logOnlyDirty() // Only log changed attributes
            ->dontSubmitEmptyLogs(); // Don't log if nothing changed
    }

    /**
     * Tap into the activity before it is saved.
     * Auto-assign org_id from authenticated user or model itself.
     */
    public function tapActivity(Activity $activity, string $eventName)
    {
        // 1. Try to get org_id from the authenticated user (Reviewer/Editor)
        if (auth()->check() && isset(auth()->user()->org_id)) {
            $activity->org_id = auth()->user()->org_id;
        }
        // 2. Fallback: If the model itself has an org_id (e.g. creating a Room belonging to an Org)
        elseif (isset($this->org_id)) {
            $activity->org_id = $this->org_id;
        }
    }
}
