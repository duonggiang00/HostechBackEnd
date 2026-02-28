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

use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class User extends Authenticatable implements HasMedia
{
    use HasApiTokens, HasFactory, HasRoles, HasUuids, MultiTenant, Notifiable, SoftDeletes, SystemLoggable, InteractsWithMedia;

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

    /**
     * Managed properties for Manager/Staff roles
     */
    public function properties()
    {
        return $this->belongsToMany(\App\Models\Property\Property::class, 'property_user')
                    ->withTimestamps();
    }
}
