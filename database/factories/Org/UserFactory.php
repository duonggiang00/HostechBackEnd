<?php

namespace Database\Factories\Org;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Org\User>
 */
class UserFactory extends Factory
{
    public function definition(): array
    {
        return [
            'id' => Str::uuid(),
            'org_id' => null,
            'full_name' => fake()->name(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->unique()->safeEmail(),
            'password_hash' => Hash::make('12345678'),
            'email_verified_at' => now(),
            'is_active' => true,
            'mfa_enabled' => false,
        ];
    }

    public function admin(): static
    {
        return $this->state(fn (array $attributes) => [
            'full_name' => 'System Administrator',
            'email' => 'admin@example.com',
            'org_id' => null,
        ])->afterCreating(function ($user) {
            $user->assignRole('Admin');
        });
    }

    public function owner(): static
    {
        return $this->state(fn (array $attributes) => [
            'full_name' => fake()->name(),
            'email' => 'owner.'.fake()->unique()->slug().'@org.example.com',
        ])->afterCreating(function ($user) {
            $user->assignRole('Owner');
        });
    }

    public function manager(): static
    {
        return $this->state(fn (array $attributes) => [
            'full_name' => fake()->name(),
            'email' => 'manager.'.fake()->unique()->slug().'@org.example.com',
        ])->afterCreating(function ($user) {
            $user->assignRole('Manager');
        });
    }

    public function staff(): static
    {
        return $this->state(fn (array $attributes) => [
            'full_name' => fake()->name(),
            'email' => 'staff.'.fake()->unique()->slug().'@org.example.com',
        ])->afterCreating(function ($user) {
            $user->assignRole('Staff');
        });
    }

    public function tenant(): static
    {
        return $this->state(fn (array $attributes) => [
            'full_name' => fake()->name(),
            'email' => 'tenant.'.fake()->unique()->slug().'@org.example.com',
        ])->afterCreating(function ($user) {
            $user->assignRole('Tenant');
        });
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
