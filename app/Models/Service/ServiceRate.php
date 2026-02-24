<?php

namespace App\Models\Service;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Org\User;

class ServiceRate extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    const UPDATED_AT = null;

    protected $fillable = [
        'org_id',
        'service_id',
        'effective_from',
        'price',
        'created_by_user_id',
    ];

    protected $casts = [
        'effective_from' => 'date',
        'price' => 'decimal:2',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function tieredRates()
    {
        return $this->hasMany(TieredRate::class)->orderBy('tier_from', 'asc');
    }
}
