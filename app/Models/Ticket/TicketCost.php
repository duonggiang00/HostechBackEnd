<?php

namespace App\Models\Ticket;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketCost extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;
    protected $keyType = 'string';

    // Bảng này không có field updated_at
    public const UPDATED_AT = null;

    protected $fillable = [
        'org_id',
        'ticket_id',
        'amount',
        'payer',
        'note',
        'created_by_user_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
