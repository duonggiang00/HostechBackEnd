<?php

namespace App\Models\Property;

use App\Models\Concerns\MultiTenant;
use App\Models\Service\Service;
use App\Traits\HasMediaAttachments;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class RoomTemplate extends Model implements HasMedia
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;
    use InteractsWithMedia, HasMediaAttachments;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'org_id', 'property_id', 'name',
        'area', 'capacity', 'base_price', 'description'
    ];

    protected $casts = [
        'area'       => 'decimal:2',
        'base_price' => 'decimal:2',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('gallery');
        $this->addMediaCollection('cover')->singleFile();
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
            ->width(400)
            ->height(300)
            ->nonQueued();
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function services()
    {
        return $this->belongsToMany(Service::class, 'room_template_services');
    }

    public function assets()
    {
        return $this->hasMany(RoomTemplateAsset::class);
    }
}
