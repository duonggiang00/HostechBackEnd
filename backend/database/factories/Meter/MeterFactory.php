<?php

namespace Database\Factories\Meter;


use App\Features\Meter\Models\Meter;
use App\Features\Org\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

class MeterFactory extends Factory
{
    protected $model = Meter::class;

    public function definition(): array
    {
        return [
            'org_id' => Org::inRandomOrder()->first()->id ?? Org::factory(),
            'property_id' => null,
            'room_id' => null,
            'service_id' => null,
            'code' => $this->faker->unique()->bothify('MT-#####'),
            'type' => $this->faker->randomElement(['ELECTRIC', 'WATER']),
            'installed_at' => $this->faker->date(),
            'is_active' => true,
        ];
    }
}
