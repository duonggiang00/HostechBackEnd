<?php

namespace Database\Factories\Meter;

use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class MeterReadingFactory extends Factory
{
    protected $model = MeterReading::class;

    public function definition(): array
    {
        $start = $this->faker->dateTimeBetween('-6 months', 'now');
        $end = (clone $start)->modify('+1 month');

        return [
            'org_id' => Org::inRandomOrder()->first()->id ?? Org::factory(),
            'meter_id' => Meter::inRandomOrder()->first()->id ?? Meter::factory(),
            'period_start' => $start->format('Y-m-d'),
            'period_end' => $end->format('Y-m-d'),
            'reading_value' => $this->faker->numberBetween(100, 5000),
            'status' => $this->faker->randomElement(['DRAFT', 'SUBMITTED', 'APPROVED', 'LOCKED']),
        ];
    }
}
