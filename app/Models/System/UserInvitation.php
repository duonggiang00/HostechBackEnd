<?php

namespace App\Models\System;

use App\Models\Org\Org;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Concerns\MultiTenant;

class UserInvitation extends Model
{
    use HasFactory, HasUuids, SoftDeletes, MultiTenant;

    protected $fillable = [
        'email',
        'token',
        'role_name',
        'org_id',
        'properties_scope',
        'invited_by',
        'expires_at',
        'registered_at',
    ];

    protected function casts(): array
    {
        return [
            'properties_scope' => 'array',
            'expires_at' => 'datetime',
            'registered_at' => 'datetime',
        ];
    }

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function inviter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
}
