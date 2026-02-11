<?php

namespace App\Models;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = ['id', 'org_id', 'property_id', 'floor_id', 'code', 'name', 'type', 'area', 'floor', 'capacity', 'base_price', 'status', 'description', 'amenities', 'utilities'];

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

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }
}
