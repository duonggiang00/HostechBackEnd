<?php

namespace App\Models\Org;

use App\Models\Concerns\MultiTenant;
use App\Models\Contract\ContractMember;
use App\Models\Property\Property;
use App\Traits\SystemLoggable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements HasMedia
{
    use HasApiTokens, HasFactory, HasRoles, HasUuids, InteractsWithMedia, MultiTenant, Notifiable, SoftDeletes, SystemLoggable, TwoFactorAuthenticatable;

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
        // Personal / identity
        'identity_number',
        'identity_issued_date',
        'identity_issued_place',
        'date_of_birth',
        'address',
        'license_plate',
        'mfa_enabled',
        'mfa_method',
        'mfa_methods',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'last_login_at',
    ];

    protected $hidden = [
        'password_hash',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'mfa_enabled' => 'boolean',
            'mfa_methods' => 'array',
            'is_active' => 'boolean',
            'meta' => 'array',
        ];
    }

    public function org()
    {
        return $this->belongsTo(Org::class, 'org_id');
    }

    /**
     * Ghi nhận phiên đăng nhập API thành công (Fortify + Sanctum).
     */
    public function recordLoginAt(?Carbon $at = null): void
    {
        $this->forceFill(['last_login_at' => $at ?? now()])->saveQuietly();
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
        $this->attributes['password_hash'] = Hash::make($value);
    }

    /**
     * Managed properties for Manager/Staff roles
     */
    public function properties()
    {
        return $this->belongsToMany(Property::class, 'property_user')
            ->withTimestamps();
    }

    /**
     * Contracts where the user is a member (Tenant)
     */
    public function contractMembers()
    {
        return $this->hasMany(ContractMember::class, 'user_id');
    }
}
