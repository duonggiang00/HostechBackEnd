<?php

namespace App\Features\Meter\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Org\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class AdjustmentNote extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes;

    const UPDATED_AT = null;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'meter_reading_id',
        'reason',
        'before_value',
        'after_value',
        'requested_by_user_id',
        'approved_by_user_id',
        'approved_at',
        'rejected_by_user_id',
        'rejected_at',
        'reject_reason',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    public function meterReading(): BelongsTo
    {
        return $this->belongsTo(MeterReading::class);
    }

    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by_user_id');
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('adjustment_proofs');
    }
}
