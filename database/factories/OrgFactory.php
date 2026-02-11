<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class OrgFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'name' => fake()->company(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->companyEmail(),
            'address' => fake()->address(),
            'timezone' => 'Asia/Bangkok',
            'currency' => 'VND',
        ];
    }
}
