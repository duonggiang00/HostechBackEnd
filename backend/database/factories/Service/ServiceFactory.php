<?php

namespace Database\Factories\Service;

use App\Models\Org\Org;
use App\Models\Service\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Service>
 */
class ServiceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'code' => $this->faker->unique()->bothify('SVC-####'),
            'name' => $this->faker->words(3, true),
            'calc_mode' => $this->faker->randomElement(['PER_ROOM', 'PER_PERSON', 'PER_QUANTITY', 'PER_METER']),
            'unit' => $this->faker->word,
            'is_recurring' => true,
            'is_active' => true,
            'meta' => null,
            'type' => 'OTHER',
        ];
    }

    public function electric(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'DIEN',
            'name' => 'Tiền điện',
            'calc_mode' => 'PER_METER',
            'unit' => 'kwh',
            'type' => 'ELECTRIC',
        ]);
    }

    public function water(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'NUOC',
            'name' => 'Tiền nước',
            'calc_mode' => 'PER_METER',
            'unit' => 'm3',
            'type' => 'WATER',
        ]);
    }

    public function internet(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'INTERNET',
            'name' => 'Internet',
            'calc_mode' => 'PER_ROOM',
            'unit' => 'tháng',
            'type' => 'OTHER',
        ]);
    }

    public function management(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'QL',
            'name' => 'Phí quản lý',
            'calc_mode' => 'PER_ROOM',
            'unit' => 'tháng',
            'type' => 'OTHER',
        ]);
    }

    public function parking(): static
    {
        return $this->state(fn (array $attributes) => [
            'code' => 'GUIXE',
            'name' => 'Gửi xe máy',
            'calc_mode' => 'PER_QUANTITY',
            'unit' => 'xe',
            'type' => 'OTHER',
        ]);
    }
}
