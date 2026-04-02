<?php

namespace Database\Factories\Property;

use App\Features\Property\Models\RoomTemplate;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoomTemplateFactory extends Factory
{
    protected $model = RoomTemplate::class;

    public function definition(): array
    {
        $types = ['apartment', 'studio', 'room', 'office', 'shophouse'];
        $type = $this->faker->randomElement($types);
        
        $areas = [
            'apartment' => [45, 90],
            'studio' => [25, 40],
            'room' => [15, 30],
            'office' => [30, 200],
            'shophouse' => [100, 300],
        ];

        $range = $areas[$type];
        $area = $this->faker->numberBetween($range[0], $range[1]);

        return [
            'name' => $this->faker->words(3, true) . ' Template',
            'room_type' => $type,
            'area' => $area,
            'capacity' => $this->faker->numberBetween(1, 4),
            'base_price' => $area * $this->faker->numberBetween(100, 250) * 1000,
            'description' => $this->faker->paragraph(),
            'amenities' => [
                'wifi' => true,
                'air_conditioner' => $this->faker->boolean(80),
                'fridge' => $this->faker->boolean(60),
                'bed' => true,
            ],
            'utilities' => [
                'electricity' => 'metered',
                'water' => 'metered',
            ],
        ];
    }
}
