<?php

namespace App\Models\Service;

use App\Models\Concerns\MultiTenant;
use App\Models\Property\Room;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomService extends Pivot
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

    protected $table = 'room_services';

    protected $guarded = [];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'included_units' => 'integer',
            'meta' => 'array',
        ];
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
