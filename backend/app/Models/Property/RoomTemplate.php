<?php

namespace App\Models\Property;

use App\Models\Concerns\MultiTenant;
use App\Models\Service\Service;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomTemplate extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id', 'org_id', 'property_id', 'name', 
        'area', 'capacity', 'base_price', 'description', 
        'amenities', 'utilities'
    ];

    protected $casts = [
        'area' => 'decimal:2',
        'base_price' => 'decimal:2',
        'amenities' => 'array',
        'utilities' => 'array',
    ];

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
