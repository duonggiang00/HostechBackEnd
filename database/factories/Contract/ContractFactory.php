<?php

namespace Database\Factories\Contract;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Contract\Contract>
 */
class ContractFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startDate = $this->faker->dateTimeBetween('-1 year', 'now');
        $endDate = (clone $startDate)->modify('+1 year');

        return [
            'org_id' => \App\Models\Org\Org::factory(),
            'property_id' => \App\Models\Property\Property::factory(),
            'room_id' => \App\Models\Property\Room::factory(),
            'status' => $this->faker->randomElement(['DRAFT', 'ACTIVE', 'ENDED', 'CANCELLED']),
            'start_date' => $startDate,
            'end_date' => $this->faker->boolean(80) ? $endDate : null,
            'billing_cycle' => 'MONTHLY',
            'due_day' => 5,
            'cutoff_day' => 30,
            'rent_price' => $this->faker->randomFloat(2, 2000000, 10000000),
            'deposit_amount' => function (array $attributes) {
                return $attributes['rent_price'];
            },
            'join_code' => \Illuminate\Support\Str::random(8),
            'join_code_expires_at' => $this->faker->dateTimeBetween('now', '+1 month'),
            'created_by_user_id' => \App\Models\Org\User::factory(), 
        ];
    }

    public function configure()
    {
        return $this->afterMaking(function (\App\Models\Contract\Contract $contract) {
            // Ensure consistency if room is provided
            if ($contract->room) {
                $contract->property_id = $contract->room->property_id;
                $contract->org_id = $contract->room->org_id;
            }
        });
    }
}
