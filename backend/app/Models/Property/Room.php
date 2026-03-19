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

    protected $fillable = ['id', 'org_id', 'property_id', 'floor_id', 'code', 'name', 'type', 'area', 'floor_number', 'capacity', 'base_price', 'status', 'description', 'amenities', 'utilities'];

    // ─── Scopes ──────────────────────────────────────────────────────────

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePublished($query)
    {
        return $query->where('status', '!=', 'draft');
    }

    public function scopePriceMin($query, $price)
    {
        return $query->where('base_price', '>=', $price);
    }

    public function scopePriceMax($query, $price)
    {
        return $query->where('base_price', '<=', $price);
    }

    public function scopeAreaMin($query, $area)
    {
        return $query->where('area', '>=', $area);
    }

    public function scopeAreaMax($query, $area)
    {
        return $query->where('area', '<=', $area);
    }

    public function scopeCapacityMin($query, $capacity)
    {
        return $query->where('capacity', '>=', $capacity);
    }

    public function scopeCapacityMax($query, $capacity)
    {
        return $query->where('capacity', '<=', $capacity);
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isOccupied(): bool
    {
        return $this->status === 'occupied';
    }

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

    public function floorPlanNode()
    {
        return $this->hasOne(RoomFloorPlanNode::class);
    }

    public function priceHistories()
    {
        return $this->hasMany(RoomPrice::class)->orderBy('start_date', 'desc');
    }

    public function meters()
    {
        return $this->hasMany(\App\Models\Meter\Meter::class);
    }

    public function services()
    {
        return $this->belongsToMany(\App\Models\Service\Service::class, 'room_services');
    }

    public function invoices()
    {
        return $this->hasMany(\App\Models\Invoice\Invoice::class);
    }

    public function activeContract()
    {
        return $this->hasOne(\App\Models\Contract\Contract::class)
            ->where('status', 'ACTIVE')
            ->latestOfMany();
    }
}
