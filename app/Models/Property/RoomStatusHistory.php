<?php

namespace App\Models\Property;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class RoomStatusHistory extends Model
{
    use HasUuids, MultiTenant, SystemLoggable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'org_id',
        'room_id',
        'from_status',
        'to_status',
        'reason',
        'changed_by_user_id',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function changedByUser()
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
