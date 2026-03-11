<?php

namespace Database\Factories\Meter;

use App\Models\Meter\AdjustmentNote;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AdjustmentNoteFactory extends Factory
{
    protected $model = AdjustmentNote::class;

    public function definition(): array
    {
        return [
            'org_id' => Org::inRandomOrder()->first()->id ?? Org::factory(),
            'meter_reading_id' => MeterReading::inRandomOrder()->first()->id ?? MeterReading::factory(),
            'reason' => $this->faker->sentence(),
            'before_value' => $this->faker->numberBetween(100, 500),
            'after_value' => $this->faker->numberBetween(510, 1000),
            'requested_by_user_id' => User::inRandomOrder()->first()->id ?? User::factory(),
            'status' => 'PENDING',
        ];
    }
}
