<?php

namespace App\Models\Property;

use App\Models\Concerns\MultiTenant;
use App\Models\Service\RoomService;
use App\Traits\HasMediaAttachments;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media; // Added

class Room extends Model implements HasMedia
{
    use HasFactory, HasMediaAttachments, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes, SystemLoggable; // Added

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'org_id', 'property_id', 'floor_id', 'code', 'name', 'type', 'area', 'floor', 'capacity', 'base_price', 'status', 'description', 'amenities', 'utilities'];

    protected function casts(): array
    {
        return [
            'area' => 'decimal:2',
            'base_price' => 'decimal:2',
            'amenities' => 'array',
            'utilities' => 'array',
        ];
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')->width(368)->height(232)->nonQueued();
        $this->addMediaConversion('detail')->width(800)->height(500)->nonQueued();
    }

    public function assets()
    {
        return $this->hasMany(RoomAsset::class);
    }

    public function prices()
    {
        return $this->hasMany(RoomPrice::class);
    }

    public function roomServices()
    {
        return $this->hasMany(RoomService::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(RoomStatusHistory::class);
    }

    public function contracts()
    {
        return $this->hasMany(\App\Models\Contract\Contract::class);
    }
}
