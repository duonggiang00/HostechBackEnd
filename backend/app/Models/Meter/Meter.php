<?php

namespace App\Models\Meter;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Property\Room;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Meter extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id', 'room_id', 'property_id', 'code', 'type', 'base_reading', 'is_master', 'installed_at', 'is_active', 'meta',
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
        return $this->belongsTo(\App\Models\Property\Property::class);
    }

    public function service()
    {
        return $this->belongsTo(\App\Models\Service\Service::class);
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
