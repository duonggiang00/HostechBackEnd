<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class RoomFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'property_id' => null,
            'floor_id' => null,
            'code' => strtoupper(fake()->lexify('?')) . str_pad(fake()->numberBetween(1, 99999), 5, '0', STR_PAD_LEFT),
            'name' => 'Room '.fake()->numberBetween(101, 999),
            'type' => fake()->randomElement(['studio', 'apartment', 'house', 'dormitory']),
            'area' => fake()->numberBetween(20, 150),
            'floor' => fake()->numberBetween(1, 20),
            'capacity' => fake()->numberBetween(1, 6),
            'base_price' => fake()->numberBetween(5000000, 50000000),
            'status' => fake()->randomElement(['available', 'occupied', 'maintenance']),
            'description' => fake()->sentence(),
            'amenities' => json_encode(fake()->randomElements(['WiFi', 'AC', 'TV', 'Bed', 'Kitchen'], 3)),
            'utilities' => json_encode(fake()->randomElements(['Electricity', 'Water', 'Gas'], 2)),
        ];
    }
}
