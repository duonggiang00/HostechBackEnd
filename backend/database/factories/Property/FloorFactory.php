<?php

namespace Database\Factories\Property;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class FloorFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'property_id' => null,
            'code' => strtoupper(fake()->unique()->lexify('F??')),
            'name' => 'Floor '.fake()->numberBetween(1, 20),
            'sort_order' => fake()->numberBetween(0, 99),
        ];
    }
}
