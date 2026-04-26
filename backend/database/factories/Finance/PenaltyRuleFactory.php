<?php

namespace Database\Factories\Finance;

use App\Enums\PenaltyRuleCalcMode;
use App\Enums\PenaltyRuleType;
use App\Models\Finance\PenaltyRule;
use App\Models\Org\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class PenaltyRuleFactory extends Factory
{
    protected $model = PenaltyRule::class;

    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'property_id' => null,
            'type' => PenaltyRuleType::LATE_PAYMENT,
            'calc_mode' => PenaltyRuleCalcMode::FIXED,
            'value' => 100000,
            'grace_days' => 0,
            'is_active' => true,
        ];
    }

    public function percentRent(): self
    {
        return $this->state(fn (array $attributes) => [
            'calc_mode' => PenaltyRuleCalcMode::PERCENT_RENT,
            'value' => 10, // 10%
        ]);
    }

    public function percentDeposit(): self
    {
        return $this->state(fn (array $attributes) => [
            'calc_mode' => PenaltyRuleCalcMode::PERCENT_DEPOSIT,
            'value' => 50, // 50%
        ]);
    }
}
