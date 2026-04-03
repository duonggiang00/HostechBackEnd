<?php

namespace App\Features\Notification\Models;

use App\Core\Models\Concerns\MultiTenant;
use App\Features\Org\Models\Org;
use App\Features\Property\Models\Property;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationRule extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'trigger',
        'schedule',
        'template_id',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'schedule' => 'array',
            'is_active' => 'boolean',
        ];
    }

    // ─── Relations ────────────────────────────────────

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(NotificationTemplate::class, 'template_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(NotificationLog::class, 'rule_id');
    }

    // ─── Scopes ───────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByTrigger($query, string $trigger)
    {
        return $query->where('trigger', $trigger);
    }
}
