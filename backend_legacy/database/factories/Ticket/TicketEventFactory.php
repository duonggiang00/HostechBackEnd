<?php

namespace Database\Factories\Ticket;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Ticket\TicketEvent>
 */
class TicketEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'org_id' => \App\Models\Org\Org::factory(),
            'ticket_id' => \App\Models\Ticket\Ticket::factory(),
            'actor_user_id' => \App\Models\Org\User::factory(),
            'type' => 'COMMENT',
            'message' => $this->faker->sentence(),
            'meta' => null,
        ];
    }
}
