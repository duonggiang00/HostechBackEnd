<?php

namespace Database\Factories\Property;

use App\Models\Property\RoomTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomTemplateFactory extends Factory
{
    protected $model = RoomTemplate::class;

    public function definition(): array
    {
        $area = $this->faker->numberBetween(15, 30);
        return [
            'name' => $this->faker->words(3, true) . ' Template',
            'area' => $area,
            'capacity' => $this->faker->numberBetween(1, 4),
            'base_price' => $area * $this->faker->numberBetween(100, 250) * 1000,
            'description' => $this->faker->paragraph(),
        ];
    }
}
