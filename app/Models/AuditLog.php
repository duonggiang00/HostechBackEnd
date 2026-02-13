<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Activity;

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
