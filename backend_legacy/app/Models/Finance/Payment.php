<?php

namespace App\Models\Finance;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'payer_user_id',
        'received_by_user_id',
        'method',
        'amount',
        'reference',
        'received_at',
        'status',
        'approved_by_user_id',
        'approved_at',
        'note',
        'provider_ref',
        'provider_status',
        'webhook_payload',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'amount'          => 'decimal:2',
            'received_at'     => 'datetime',
            'approved_at'     => 'datetime',
            'webhook_payload' => 'array',
            'meta'            => 'array',
        ];
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  RELATIONSHIPS                                        ║
    // ╠═══════════════════════════════════════════════════════╣

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function payer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'payer_user_id');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    public function ledgerEntries(): HasMany
    {
        return $this->hasMany(LedgerEntry::class, 'ref_id')->where('ref_type', 'payment');
    }

    public function receipt(): HasOne
    {
        return $this->hasOne(Receipt::class);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  HELPERS                                              ║
    // ╠═══════════════════════════════════════════════════════╣

    public function isApproved(): bool
    {
        return $this->status === 'APPROVED';
    }
}
