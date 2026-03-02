<?php

namespace App\Models\Handover;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Property\RoomAsset;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class HandoverItem extends Model implements HasMedia
{
    use HasFactory, HasUuids, MultiTenant, InteractsWithMedia;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'handover_id',
        'room_asset_id',
        'name',
        'status',
        'note',
        'sort_order',
    ];

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function handover()
    {
        return $this->belongsTo(Handover::class);
    }

    public function roomAsset()
    {
        return $this->belongsTo(RoomAsset::class);
    }
}
