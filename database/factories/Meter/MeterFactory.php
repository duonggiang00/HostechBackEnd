<?php

namespace Database\Factories\Meter;

use App\Models\Meter\Meter;
use App\Models\Org\Org;
use App\Models\Property\Room;
use Illuminate\Database\Eloquent\Factories\Factory;

class MeterFactory extends Factory
{
    protected $model = Meter::class;

    public function definition(): array
    {
        return [
            'org_id' => Org::inRandomOrder()->first()->id ?? Org::factory(),
            'room_id' => Room::inRandomOrder()->first()->id ?? Room::factory(),
            'code' => $this->faker->unique()->bothify('MT-#####'),
            'type' => $this->faker->randomElement(['ELECTRIC', 'WATER']),
            'installed_at' => $this->faker->date(),
            'is_active' => true,
        ];
    }
}
