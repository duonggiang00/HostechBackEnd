<?php

namespace Database\Factories\Ticket;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket\TicketCost>
 */
class TicketCostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'org_id' => \App\Models\Org\Org::factory(),
            'ticket_id' => \App\Models\Ticket\Ticket::factory(),
            'amount' => $this->faker->randomFloat(2, 50000, 2000000),
            'payer' => $this->faker->randomElement(['OWNER', 'TENANT']),
            'note' => $this->faker->sentence(),
            'created_by_user_id' => \App\Models\Org\User::factory(),
        ];
    }
}
