<?php

namespace App\Features\Notification\Models;

use App\Core\Models\Concerns\MultiTenant;
use App\Features\Org\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationLog extends Model
{
    use HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    /**
     * Logs only have created_at, no updated_at.
     */
    public $timestamps = false;

    protected $fillable = [
        'org_id',
        'rule_id',
        'user_id',
        'channel',
        'status',
        'provider_id',
        'payload',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'created_at' => 'datetime',
        ];
    }

    // ─── Relations ────────────────────────────────────

    public function rule(): BelongsTo
    {
        return $this->belongsTo(NotificationRule::class, 'rule_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ─── Scopes ───────────────────────────────────────

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeSent($query)
    {
        return $query->where('status', 'SENT');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'FAILED');
    }
}
