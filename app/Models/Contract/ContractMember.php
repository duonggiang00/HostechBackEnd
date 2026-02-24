<?php

namespace App\Models\Contract;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Org\Org;
use App\Models\Org\User;

class ContractMember extends Model
{
    /** @use HasFactory<\Database\Factories\ContractMemberFactory> */
    use HasFactory, HasUuids;

    protected $fillable = [
        'org_id',
        'contract_id',
        'user_id',
        'role',
        'is_primary',
        'joined_at',
        'left_at',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'joined_at' => 'datetime',
        'left_at' => 'datetime',
    ];

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }
}
