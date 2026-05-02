<?php

namespace App\Models\Contract;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RefundReceipt extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    public const PAYOUT_METHOD_CASH = 'CASH';

    public const PAYOUT_METHOD_TRANSFER = 'TRANSFER';

    protected $fillable = [
        'org_id',
        'contract_id',
        'amount',
        'meta',
        'reference',
        'pdf_path',
        'pdf_sha256',
        'paid_at',
        'paid_by_user_id',
        'payout_method',
        'payout_reference',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'meta' => 'array',
            'paid_at' => 'datetime',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function paidBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'paid_by_user_id');
    }

    public function isPaid(): bool
    {
        return $this->paid_at !== null;
    }
}
