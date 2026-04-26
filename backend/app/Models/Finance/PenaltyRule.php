<?php

namespace App\Models\Finance;

use App\Enums\PenaltyRuleCalcMode;
use App\Enums\PenaltyRuleType;
use App\Models\Concerns\MultiTenant;
use App\Models\Org\Org;
use App\Models\Property\Property;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PenaltyRule extends Model
{
    use HasFactory, HasUuids, MultiTenant, SoftDeletes;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'org_id',
        'property_id',
        'type',
        'calc_mode',
        'value',
        'grace_days',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'type' => PenaltyRuleType::class,
            'calc_mode' => PenaltyRuleCalcMode::class,
            'value' => 'decimal:2',
            'grace_days' => 'integer',
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

    // ─── Logic ────────────────────────────────────────

    /**
     * Tính toán số tiền phạt dựa trên số tiền cơ sở (tiền thuê hoặc tiền cọc).
     */
    public function calculate(float $rentPrice, float $depositAmount): float
    {
        return match ($this->calc_mode) {
            PenaltyRuleCalcMode::FIXED => (float) $this->value,
            PenaltyRuleCalcMode::PERCENT_RENT => $rentPrice * ($this->value / 100),
            PenaltyRuleCalcMode::PERCENT_DEPOSIT => $depositAmount * ($this->value / 100),
            PenaltyRuleCalcMode::PER_DAY => (float) $this->value, // Cần logic nhân ngày ở service
            default => 0,
        };
    }

    // ─── Scopes ───────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
