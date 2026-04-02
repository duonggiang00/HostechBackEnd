<?php

namespace Database\Factories\Ticket;

use App\Features\Ticket\Models\TicketEvent;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Ticket\Models\TicketEvent>
 */
class TicketEventFactory extends Factory
{
    protected $model = TicketEvent::class;

    public function definition(): array
    {
        return [
            'org_id' => \App\Features\Org\Models\Org::factory(),
            'ticket_id' => \App\Features\Ticket\Models\Ticket::factory(),
            'actor_user_id' => \App\Features\Org\Models\User::factory(),
            'type' => 'COMMENT',
            'message' => $this->faker->sentence(),
            'meta' => null,
        ];
    }
}
