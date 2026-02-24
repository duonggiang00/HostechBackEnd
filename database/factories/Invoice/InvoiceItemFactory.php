<?php

namespace Database\Factories\Invoice;

use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Org\Org;
use App\Models\Service\Service;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Invoice\InvoiceItem>
 */
class InvoiceItemFactory extends Factory
{
    protected $model = InvoiceItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'org_id' => Org::factory(),
            'invoice_id' => Invoice::factory(),
            'type' => 'SERVICE',
            'service_id' => Service::factory(),
            'description' => $this->faker->sentence(3),
            'quantity' => 1.00,
            'unit_price' => $this->faker->randomFloat(2, 50, 500),
            'amount' => function (array $attributes) {
                return $attributes['quantity'] * $attributes['unit_price'];
            },
            'meta' => null,
        ];
    }

    public function rent()
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'RENT',
            'service_id' => null,
            'description' => 'Tiền phòng',
        ]);
    }

    public function penalty()
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'PENALTY',
            'service_id' => null,
            'description' => 'Phí phạt trễ hạn',
        ]);
    }

    public function discount()
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'DISCOUNT',
            'service_id' => null,
            'description' => 'Khuyến mãi / Giảm trừ',
            'quantity' => 1.00,
            'unit_price' => -abs($this->faker->randomFloat(2, 10, 100)), // Negative value
            'amount' => function (array $attributes) {
                return $attributes['quantity'] * $attributes['unit_price'];
            },
        ]);
    }
}
