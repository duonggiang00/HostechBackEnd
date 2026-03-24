<?php

namespace App\Models\Invoice;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payment extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes, SystemLoggable;

    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'invoice_id',
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
            'amount' => 'decimal:2',
            'received_at' => 'datetime',
            'approved_at' => 'datetime',
            'webhook_payload' => 'array',
            'meta' => 'array',
        ];
    }

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function invoice()
    {
        return $this->belongsTo(Invoice::class);
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by_user_id');
    }

    public function payer()
    {
        return $this->belongsTo(User::class, 'payer_user_id');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }
}
