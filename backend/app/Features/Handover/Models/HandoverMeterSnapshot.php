<?php

namespace App\Features\Handover\Models;

use App\Features\Meter\Models\Meter;
use App\Core\Models\Concerns\MultiTenant;

use App\Features\Org\Models\Org;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class HandoverMeterSnapshot extends Model implements HasMedia
{
    use HasFactory, HasUuids, InteractsWithMedia, MultiTenant, SoftDeletes;
 
    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'handover_id',
        'meter_id',
        'reading_value',
    ];

    protected function casts(): array
    {
        return [
            'reading_value' => 'integer',
            'confirmed_at' => 'datetime',
            'locked_at' => 'datetime',
        ];
    }

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function handover()
    {
        return $this->belongsTo(Handover::class);
    }

    public function meter()
    {
        return $this->belongsTo(Meter::class);
    }
}
