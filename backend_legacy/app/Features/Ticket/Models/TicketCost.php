<?php

namespace App\Features\Ticket\Models;

use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Core\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TicketCost extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;
 
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

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

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
