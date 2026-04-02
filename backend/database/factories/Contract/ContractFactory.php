<?php

namespace Database\Factories\Contract;

use App\Features\Contract\Models\Contract;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Features\Org\Models\Org;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Contract\Models\Contract>
 */
class ContractFactory extends Factory
{
    protected $model = Contract::class;

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
            'org_id' => Org::factory(),
            'property_id' => Property::factory(),
            'room_id' => Room::factory(),
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
            'created_by_user_id' => \App\Features\Org\Models\User::factory(),
        ];
    }

    public function configure()
    {
        return $this->afterMaking(function (Contract $contract) {
            // Ensure consistency if room is provided
            if ($contract->room) {
                $contract->property_id = $contract->room->property_id;
                $contract->org_id = $contract->room->org_id;
            }
        });
    }
}
