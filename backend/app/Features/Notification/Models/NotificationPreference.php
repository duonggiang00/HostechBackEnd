<?php

namespace App\Features\Notification\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Org\Models\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class NotificationPreference extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'user_id',
        'channels',
        'opted_out',
    ];

    protected function casts(): array
    {
        return [
            'channels' => 'array',
            'opted_out' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if user wants to receive notifications on a specific channel.
     */
    public function receivesOn(string $channel): bool
    {
        if ($this->opted_out) {
            return false;
        }

        $channels = $this->channels ?? ['IN_APP'];

        return in_array($channel, $channels);
    }
}
