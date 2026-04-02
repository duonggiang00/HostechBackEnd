<?php

namespace App\Features\Property\Models;

use App\Core\Models\Concerns\MultiTenant;
use App\Features\Org\Models\User;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

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
