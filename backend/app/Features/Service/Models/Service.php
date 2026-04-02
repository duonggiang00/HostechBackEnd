<?php

namespace App\Features\Service\Models;

use App\Models\Concerns\MultiTenant;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;

    protected $fillable = [
        'org_id',
        'property_id',
        'code',
        'name',
        'calc_mode',
        'unit',
        'is_recurring',
        'is_active',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'is_recurring' => 'boolean',
            'is_active' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function rates(): HasMany
    {
        return $this->hasMany(ServiceRate::class)->orderBy('effective_from', 'desc');
    }

    /**
     * Get the current active rate for the service.
     * Logic: The latest rate where effective_from <= today.
     */
    public function currentRate(): HasOne
    {
        return $this->hasOne(ServiceRate::class)
            ->ofMany([
                'effective_from' => 'max',
                'id' => 'max', // Tie-breaker
            ], function ($query) {
                $query->where('effective_from', '<=', now()->toDateString());
            });
    }

    /**
     * Helper to get the actual price value
     */
    public function getCurrentPriceAttribute()
    {
        return $this->currentRate?->price ?? 0;
    }

    public function property(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Features\Property\Models\Property::class);
    }
}
