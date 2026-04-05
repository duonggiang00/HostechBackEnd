<?php

namespace App\Models\Contract;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContractStatusHistory extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'contract_id',
        'from_status',
        'to_status',
        'changed_by_user_id',
        'notes',
    ];

    protected function casts(): array
    {
        return [];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
