<?php

namespace App\Features\Contract\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Invoice\Models\Invoice;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Features\Contract\Enums\ContractStatus;
use App\Features\Contract\Enums\DepositStatus;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class Contract extends Model implements HasMedia
{
    /** @use HasFactory<\Database\Factories\ContractFactory> */
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable, InteractsWithMedia;

    public $incrementing = false;

    protected $keyType = 'string';

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
        'next_billing_date',
        'rent_price',
        'deposit_amount',
        'deposit_status',
        'refunded_amount',
        'forfeited_amount',
        'join_code',
        'join_code_expires_at',
        'join_code_revoked_at',
        'signed_at',
        'terminated_at',
        'base_rent',
        'fixed_services_fee',
        'total_rent',
        'cycle_months',
        'rent_token_balance',
        'created_by_user_id',
        'document_path',
        'document_type',
        'scan_original_filename',
        'meta',
    ];

    protected function casts(): array
    {
        return [
            'status' => ContractStatus::class,
            'deposit_status' => DepositStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'next_billing_date' => 'date',
            'base_rent' => 'decimal:2',
            'fixed_services_fee' => 'decimal:2',
            'total_rent' => 'decimal:2',
            'cycle_months' => 'integer',
            'rent_price' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'refunded_amount' => 'decimal:2',
            'forfeited_amount' => 'decimal:2',
            'rent_token_balance' => 'integer',
            'join_code_expires_at' => 'datetime',
            'join_code_revoked_at' => 'datetime',
            'signed_at' => 'datetime',
            'terminated_at' => 'datetime',
            'meta' => 'array',
        ];
    }

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

    public function invoices(): HasMany
    {
        return $this->hasMany(Invoice::class);
    }

    public function handovers(): HasMany
    {
        return $this->hasMany(\App\Features\Handover\Models\Handover::class);
    }
}
