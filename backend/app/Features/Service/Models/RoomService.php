<?php

namespace App\Features\Service\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Property\Models\Room;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomService extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

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
