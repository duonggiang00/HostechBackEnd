<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomAsset extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $guarded = [];

    protected $casts = [
        'purchased_at' => 'date',
        'warranty_end' => 'date',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }
}
