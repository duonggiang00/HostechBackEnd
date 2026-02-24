<?php

namespace App\Models\Property;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Org\User;

class RoomPrice extends Model
{
    use HasFactory, HasUuids;

    protected $guarded = [];

    protected $casts = [
        'effective_from' => 'date',
        'price' => 'decimal:2',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
