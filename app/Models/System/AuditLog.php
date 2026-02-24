<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Activity;
use App\Models\Org\Org;

class AuditLog extends Activity
{
    use HasUuids;

    public $incrementing = false;

    // Relationship to Organization
    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}
