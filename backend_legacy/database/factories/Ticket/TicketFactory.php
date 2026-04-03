<?php

namespace Database\Factories\Ticket;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket\Ticket>
 */
class TicketFactory extends Factory
{
    public function definition(): array
    {
        return [
            'org_id' => \App\Models\Org\Org::factory(),
            'property_id' => \App\Models\Property\Property::factory(),
            'room_id' => \App\Models\Property\Room::factory(),
            'contract_id' => null,
            'created_by_user_id' => \App\Models\Org\User::factory(),
            'assigned_to_user_id' => null,
            'category' => $this->faker->randomElement(['\u0110i\u1ec7n', 'N\u01b0\u1edbc', 'C\u01a1 s\u1edf v\u1eadt ch\u1ea5t', 'An ninh', 'V\u1ec7 sinh']),
            'priority' => $this->faker->randomElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
            'status' => 'OPEN',
            'description' => $this->faker->sentence(10),
            'due_at' => $this->faker->optional(0.6)->dateTimeBetween('now', '+30 days'),
            'closed_at' => null,
        ];
    }

    public function open(): static
    {
        return $this->state(['status' => 'OPEN']);
    }

    public function inProgress(): static
    {
        return $this->state(['status' => 'IN_PROGRESS']);
    }

    public function done(): static
    {
        return $this->state(['status' => 'DONE', 'closed_at' => now()]);
    }
}
