<?php

namespace App\Features\System\Models;

use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Models\Concerns\MultiTenant;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UserInvitation extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

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
