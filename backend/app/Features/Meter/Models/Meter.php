<?php

namespace App\Features\Meter\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Org\Models\Org;
use App\Features\Property\Models\Room;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Meter extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes, SystemLoggable;
 
    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('meter_attachments');
    }

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id', 'room_id', 'property_id', 'service_id', 'code', 'type', 'base_reading', 'is_master', 'installed_at', 'is_active', 'meta',
    ];

    protected function casts(): array
    {
        return [
            'installed_at' => 'date',
            'is_active' => 'boolean',
            'is_master' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function property()
    {
        return $this->belongsTo(\App\Features\Property\Models\Property::class);
    }

    public function service()
    {
        return $this->belongsTo(\App\Features\Service\Models\Service::class);
    }

    public function readings()
    {
        return $this->hasMany(MeterReading::class);
    }

    public function latestReading()
    {
        return $this->hasOne(MeterReading::class)->latestOfMany();
    }

    public function latestApprovedReading()
    {
        return $this->hasOne(MeterReading::class)
            ->where('status', 'APPROVED')
            ->latest('period_end');
    }
}
