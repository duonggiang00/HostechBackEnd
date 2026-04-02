<?php

namespace Database\Factories\Handover;

use App\Features\Handover\Models\HandoverItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Features\Handover\Models\HandoverItem>
 */
class HandoverItemFactory extends Factory
{
    protected $model = HandoverItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            //
        ];
    }
}
