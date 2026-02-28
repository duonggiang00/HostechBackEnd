<?php

namespace App\Models\Meter;

use App\Models\Org\User;
use App\Traits\OrgScoped;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdjustmentNote extends Model
{
    use HasFactory, HasUuids, OrgScoped;

    protected $fillable = [
        'org_id',
        'meter_reading_id',
        'reason',
        'before_value',
        'after_value',
        'requested_by_user_id',
        'approved_by_user_id',
        'approved_at',
    ];

    protected $casts = [
        'approved_at' => 'datetime',
    ];

    /**
     * @return BelongsTo
     */
    public function meterReading(): BelongsTo
    {
        return $this->belongsTo(MeterReading::class);
    }

    /**
     * @return BelongsTo
     */
    public function requestedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by_user_id');
    }

    /**
     * @return BelongsTo
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
