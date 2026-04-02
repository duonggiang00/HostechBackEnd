<?php

namespace Database\Factories\Service;

use App\Features\Org\Models\Org;
use App\Features\Service\Models\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Service\Models\Service>
 */
class ServiceFactory extends Factory
{
    protected $model = Service::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'code' => $this->faker->unique()->bothify('SVC-####'),
            'name' => $this->faker->words(3, true),
            'calc_mode' => $this->faker->randomElement(['PER_ROOM', 'PER_PERSON', 'PER_QUANTITY', 'PER_METER']),
            'unit' => $this->faker->word,
            'is_recurring' => true,
            'is_active' => true,
            'meta' => null,
        ];
    }
}
