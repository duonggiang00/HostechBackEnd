<?php

namespace App\Models\Handover;

use App\Models\Concerns\MultiTenant;
use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Room;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Handover extends Model implements HasMedia
{
    use HasFactory, HasUuids, MultiTenant, SystemLoggable, InteractsWithMedia;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'contract_id',
        'room_id',
        'type',
        'status',
        'note',
        'confirmed_by_user_id',
        'confirmed_at',
        'locked_at',
    ];

    protected $casts = [
        'confirmed_at' => 'datetime',
        'locked_at' => 'datetime',
    ];

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function confirmedBy()
    {
        return $this->belongsTo(User::class, 'confirmed_by_user_id');
    }

    public function items()
    {
        return $this->hasMany(HandoverItem::class);
    }

    public function meterSnapshots()
    {
        return $this->hasMany(HandoverMeterSnapshot::class);
    }
}
