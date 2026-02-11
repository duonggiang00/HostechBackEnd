<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'role' => fake()->randomElement(['ADMIN', 'OWNER', 'MANAGER', 'STAFF', 'TENANT']),
            'full_name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => Hash::make('password'),
            'email_verified_at' => now(),
            'is_active' => true,
            'mfa_enabled' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => 'ADMIN',
        ]);
    }

    public function owner(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => 'OWNER',
        ]);
    }

    public function staff(): static
    {
        return $this->state(fn(array $attributes) => [
            'role' => 'STAFF',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn(array $attributes) => [
            'is_active' => false,
        ]);
    }
}

