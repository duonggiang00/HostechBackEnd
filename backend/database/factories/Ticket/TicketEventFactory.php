<?php

namespace Database\Factories\Ticket;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Ticket\Ticket;
use App\Models\Ticket\TicketEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TicketEvent>
 */
class TicketEventFactory extends Factory
{
    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'ticket_id' => Ticket::factory(),
            'actor_user_id' => User::factory(),
            'type' => 'COMMENT',
            'message' => $this->faker->sentence(),
            'meta' => null,
        ];
    }
}
