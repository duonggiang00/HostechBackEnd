<?php

namespace App\Models\Contract;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;

class Contract extends Model
{
    /** @use HasFactory<\Database\Factories\ContractFactory> */
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'org_id',
        'property_id',
        'room_id',
        'status',
        'start_date',
        'end_date',
        'billing_cycle',
        'due_day',
        'cutoff_day',
        'rent_price',
        'deposit_amount',
        'join_code',
        'join_code_expires_at',
        'join_code_revoked_at',
        'signed_at',
        'terminated_at',
        'created_by_user_id',
        'meta',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'rent_price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'join_code_expires_at' => 'datetime',
        'join_code_revoked_at' => 'datetime',
        'signed_at' => 'datetime',
        'terminated_at' => 'datetime',
        'meta' => 'array',
    ];

    public function members(): HasMany
    {
        return $this->hasMany(ContractMember::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
