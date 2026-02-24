<?php

namespace App\Models\Service;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TieredRate extends Model
{
    use HasFactory, HasUuids;

    public $timestamps = false; // Bảng này không cần created_at/updated_at theo design

    protected $guarded = [];

    protected $casts = [
        'tier_from' => 'integer',
        'tier_to' => 'integer',
        'price' => 'decimal:2',
    ];

    public function serviceRate()
    {
        return $this->belongsTo(ServiceRate::class);
    }
}
