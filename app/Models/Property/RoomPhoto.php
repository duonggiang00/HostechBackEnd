<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RoomPhoto extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'size_bytes' => 'integer',
        'sort_order' => 'integer',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
