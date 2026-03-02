<?php

namespace App\Models\Handover;

use App\Models\Concerns\MultiTenant;
use App\Models\Meter\Meter;
use App\Models\Org\Org;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class HandoverMeterSnapshot extends Model implements HasMedia
{
    use HasFactory, HasUuids, MultiTenant, InteractsWithMedia;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'handover_id',
        'meter_id',
        'reading_value',
    ];

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
