<?php

namespace App\Models\Service;

use App\Models\Property\Room;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomService extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'quantity' => 'integer',
        'included_units' => 'integer',
        'meta' => 'array',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }
}
