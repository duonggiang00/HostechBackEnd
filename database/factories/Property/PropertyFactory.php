<?php

namespace Database\Factories\Property;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PropertyFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'code' => strtoupper(fake()->unique()->lexify('PROP-???')),
            'name' => fake()->sentence(3),
            'address' => fake()->address(),
            'note' => fake()->text(100),
            'use_floors' => true,
            'default_billing_cycle' => 'MONTHLY',
            'default_due_day' => 5,
            'default_cutoff_day' => 30,
            'bank_accounts' => json_encode([
                ['bank' => 'Vietcombank', 'account' => '1234567890'],
            ]),
        ];
    }
}
