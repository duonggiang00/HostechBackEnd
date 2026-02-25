<?php

namespace App\Models\Invoice;

use App\Models\Concerns\MultiTenant;
use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    use HasFactory, HasUuids, MultiTenant, SystemLoggable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'contract_id',
        'room_id',
        'period_start',
        'period_end',
        'status',
        'issue_date',
        'due_date',
        'total_amount',
        'paid_amount',
        'snapshot',
        'created_by_user_id',
        'issued_by_user_id',
        'issued_at',
        'cancelled_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'issue_date' => 'date',
        'due_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'snapshot' => 'array',
        'issued_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function items()
    {
        return $this->hasMany(InvoiceItem::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by_user_id');
    }
}
