<?php

namespace App\Models\Contract;

use App\Models\Concerns\MultiTenant;
use App\Models\Invoice\Invoice;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinalPaymentRequest extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'contract_id',
        'invoice_id',
        'amount_due',
        'status',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount_due' => 'decimal:2',
            'meta' => 'array',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(Contract::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }
}
