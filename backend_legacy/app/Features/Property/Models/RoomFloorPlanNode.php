<?php

namespace App\Features\Property\Models;

use App\Core\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoomFloorPlanNode extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

    protected $fillable = [
        'id',
        'org_id',
        'floor_id',
        'room_id',
        'x',
        'y',
        'width',
        'height',
        'rotation',
        'label',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'x'        => 'decimal:2',
            'y'        => 'decimal:2',
            'width'    => 'decimal:2',
            'height'   => 'decimal:2',
            'rotation' => 'decimal:2',
            'meta'     => 'array',
        ];
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }
}
