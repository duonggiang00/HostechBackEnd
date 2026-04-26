<?php

namespace Tests\Unit\Finance;

use App\Enums\PenaltyRuleCalcMode;
use App\Models\Finance\PenaltyRule;
use Tests\TestCase;

class PenaltyRuleTest extends TestCase
{
    public function test_it_calculates_fixed_penalty_correctly()
    {
        $rule = new PenaltyRule([
            'calc_mode' => PenaltyRuleCalcMode::FIXED,
            'value' => 50000
        ]);

        $this->assertEquals(50000, $rule->calculate(3000000, 5000000));
    }

    public function test_it_calculates_percent_rent_penalty_correctly()
    {
        $rule = new PenaltyRule([
            'calc_mode' => PenaltyRuleCalcMode::PERCENT_RENT,
            'value' => 10 // 10%
        ]);

        // 10% of 3,000,000 = 300,000
        $this->assertEquals(300000, $rule->calculate(3000000, 5000000));
    }

    public function test_it_calculates_percent_deposit_penalty_correctly()
    {
        $rule = new PenaltyRule([
            'calc_mode' => PenaltyRuleCalcMode::PERCENT_DEPOSIT,
            'value' => 50 // 50%
        ]);

        // 50% of 5,000,000 = 2,500,000
        $this->assertEquals(2500000, $rule->calculate(3000000, 5000000));
    }
}
