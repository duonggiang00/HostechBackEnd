<?php

namespace App\Models\Org;

use App\Models\Concerns\MultiTenant;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, HasRoles, HasUuids, MultiTenant, Notifiable, SoftDeletes, SystemLoggable;

    public $incrementing = false;
    
    // Force Spatie Permission to use 'web' guard even for Sanctum auth
    public $guard_name = 'web';

    protected $keyType = 'string';

    protected $fillable = [
        'id',
        'org_id',
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

    /**
     * Get the password for the user.
     *
     * @return string
     */
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    /**
     * Accessor to make $user->password work, while reading from password_hash column.
     */
    public function getPasswordAttribute(): ?string
    {
        return $this->password_hash;
    }

    /**
     * Mutator to hash password and set it on the password_hash attribute.
     */
    public function setPasswordAttribute(string $value): void
    {
        $this->attributes['password_hash'] = \Illuminate\Support\Facades\Hash::make($value);
    }
}
