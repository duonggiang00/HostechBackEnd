<?php

namespace App\Models\Ticket;

use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TicketEvent extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;
    protected $keyType = 'string';
    
    // Bảng này không có field updated_at
    public const UPDATED_AT = null;

    protected $fillable = [
        'org_id',
        'ticket_id',
        'actor_user_id',
        'type',
        'message',
        'meta',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function org()
    {
        return $this->belongsTo(Org::class);
    }

    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
