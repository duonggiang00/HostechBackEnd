<?php

namespace Database\Factories\Ticket;

use App\Features\Ticket\Models\TicketCost;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Ticket\Models\TicketCost>
 */
class TicketCostFactory extends Factory
{
    protected $model = TicketCost::class;

    public function definition(): array
    {
        return [
            'org_id' => \App\Features\Org\Models\Org::factory(),
            'ticket_id' => \App\Features\Ticket\Models\Ticket::factory(),
            'amount' => $this->faker->randomFloat(2, 50000, 2000000),
            'payer' => $this->faker->randomElement(['OWNER', 'TENANT']),
            'note' => $this->faker->sentence(),
            'created_by_user_id' => \App\Features\Org\Models\User::factory(),
        ];
    }
}
