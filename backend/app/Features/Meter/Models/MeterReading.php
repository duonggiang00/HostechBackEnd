<?php

namespace App\Features\Meter\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Image\Enums\Fit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MeterReading extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes;
 
    // Status constants
    const STATUS_DRAFT = 'DRAFT';
    const STATUS_SUBMITTED = 'SUBMITTED';
    const STATUS_APPROVED = 'APPROVED';
    const STATUS_REJECTED = 'REJECTED';

    const EDITABLE_STATUSES = [self::STATUS_DRAFT, self::STATUS_REJECTED];
    const SUBMITTABLE_STATUSES = [self::STATUS_DRAFT, self::STATUS_REJECTED];

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id', 'meter_id', 'period_start', 'period_end', 'reading_value', 'consumption',
        'status', 'submitted_by_user_id', 'submitted_at', 'approved_by_user_id',
        'approved_at', 'rejected_by_user_id', 'rejected_at', 'rejection_reason',
        'locked_at', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'reading_value' => 'integer',
            'consumption' => 'decimal:2',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'locked_at' => 'datetime',
            'meta' => 'array',
        ];
    }

    // ─── Relationships ───

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by_user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by_user_id');
    }

    public function adjustmentNotes()
    {
        return $this->hasMany(AdjustmentNote::class);
    }

    // ─── Status Helpers ───

    public function isEditable(): bool
    {
        return in_array($this->status, self::EDITABLE_STATUSES);
    }

    public function isSubmittable(): bool
    {
        return in_array($this->status, self::SUBMITTABLE_STATUSES);
    }

    // ─── Media ───

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('reading_proofs')
            ->singleFile()
            ->registerMediaConversions(function (Media $media) {
                $this->addMediaConversion('thumb')
                    ->fit(Fit::Crop, 300, 300)
                    ->nonQueued();
            });
    }
}
