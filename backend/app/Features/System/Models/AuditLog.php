<?php

namespace App\Features\System\Models;

use App\Core\Models\Concerns\MultiTenant;
use App\Features\Org\Models\Org;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\Models\Activity;

class AuditLog extends Activity
{
    use MultiTenant, HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected static $logAttributesToIgnore = ['*'];

    /**
     * Tùy chỉnh log trước khi lưu (SystemLoggable integration)
     */
    // Relationship to Organization
    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }
}
