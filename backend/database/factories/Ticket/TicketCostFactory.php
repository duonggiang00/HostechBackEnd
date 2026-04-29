<?php

namespace Database\Factories\Ticket;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Ticket\Ticket;
use App\Models\Ticket\TicketCost;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TicketCost>
 */
class TicketCostFactory extends Factory
{
    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'ticket_id' => Ticket::factory(),
            'amount' => $this->faker->randomFloat(2, 50000, 2000000),
            'payer' => $this->faker->randomElement(['OWNER', 'TENANT']),
            'note' => $this->faker->sentence(),
            'created_by_user_id' => User::factory(),
        ];
    }
}
