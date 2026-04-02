<?php

namespace App\Features\Property\Models;

use App\Models\Concerns\MultiTenant;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class Floor extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes, SystemLoggable;
 
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'org_id', 'property_id', 'code', 'name', 'sort_order', 'area', 'shared_area'];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'area' => 'decimal:2',
            'shared_area' => 'decimal:2',
        ];
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function rooms()
    {
        return $this->hasMany(Room::class);
    }

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('floor_plan')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')->width(368)->height(232)->nonQueued();
    }
}
