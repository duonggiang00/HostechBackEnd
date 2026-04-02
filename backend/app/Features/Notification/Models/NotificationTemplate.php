<?php

namespace App\Features\Notification\Models;

use App\Models\Concerns\MultiTenant;
use App\Features\Org\Models\Org;
use App\Features\Property\Models\Property;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationTemplate extends Model
{
    use HasFactory, HasUuids, MultiTenant;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'code',
        'channel',
        'title',
        'body',
        'variables',
        'version',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'version' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    // ─── Relations ────────────────────────────────────

    public function org(): BelongsTo
    {
        return $this->belongsTo(Org::class);
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function rules(): HasMany
    {
        return $this->hasMany(NotificationRule::class, 'template_id');
    }

    // ─── Scopes ───────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', $code);
    }

    public function scopeByChannel($query, string $channel)
    {
        return $query->where('channel', $channel);
    }

    // ─── Template Rendering ───────────────────────────

    /**
     * Render title + body by replacing {{variable}} placeholders with actual data.
     *
     * @param  array<string, string>  $data  Key-value pairs, e.g. ['meter_code' => 'E-001']
     * @return array{title: string|null, body: string}
     */
    public function render(array $data): array
    {
        $replacePairs = [];
        foreach ($data as $key => $value) {
            $replacePairs["{{" . $key . "}}"] = (string) $value;
        }

        return [
            'title' => $this->title ? strtr($this->title, $replacePairs) : null,
            'body' => strtr($this->body, $replacePairs),
        ];
    }
}
