<?php

namespace App\Models;

use App\Models\Concerns\MultiTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, HasUuids, MultiTenant, Notifiable;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'org_id',
        'role',
        'full_name',
        'phone',
        'email',
        'password_hash',
        'is_active',
        'meta',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'phone_verified_at' => 'datetime',
        'mfa_enrolled_at' => 'datetime',
        'mfa_enabled' => 'boolean',
        'is_active' => 'boolean',
        'meta' => 'array',
    ];

    public function org()
    {
        return $this->belongsTo(Org::class, 'org_id');
    }
}
