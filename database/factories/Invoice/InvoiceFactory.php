<?php

namespace Database\Factories\Invoice;

use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Carbon;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Invoice\Invoice>
 */
class InvoiceFactory extends Factory
{
    protected $model = Invoice::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $periodStart = $this->faker->dateTimeBetween('-2 months', '+1 month');
        $periodStartCarbon = Carbon::instance($periodStart)->startOfMonth();
        $periodEndCarbon = $periodStartCarbon->copy()->endOfMonth();
        $dueDate = $periodStartCarbon->copy()->addDays(5); // Due 5th of month

        return [
            'org_id' => Org::factory(),
            'property_id' => Property::factory(),
            'contract_id' => Contract::factory(),
            'room_id' => Room::factory(),
            'period_start' => $periodStartCarbon->toDateString(),
            'period_end' => $periodEndCarbon->toDateString(),
            'status' => 'DRAFT',
            'issue_date' => null,
            'due_date' => $dueDate->toDateString(),
            'total_amount' => $this->faker->randomFloat(2, 1000, 10000),
            'paid_amount' => 0.00,
            'snapshot' => null,
            'created_by_user_id' => null, // Typically set during seeding if needed
            'issued_by_user_id' => null,
            'issued_at' => null,
            'cancelled_at' => null,
        ];
    }

    public function issued()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'ISSUED',
            'issue_date' => Carbon::parse($attributes['period_start'])->toDateString(),
            'issued_at' => now(),
        ]);
    }

    public function paid()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'PAID',
            'issue_date' => Carbon::parse($attributes['period_start'])->toDateString(),
            'issued_at' => Carbon::parse($attributes['period_start'])->startOfDay(),
            'paid_amount' => $attributes['total_amount'],
        ]);
    }

    public function overdue()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'OVERDUE',
            'issue_date' => Carbon::parse($attributes['period_start'])->toDateString(),
            'issued_at' => Carbon::parse($attributes['period_start'])->startOfDay(),
            'due_date' => Carbon::parse($attributes['period_start'])->subDays(5)->toDateString(), // Make it intentionally overdue
        ]);
    }

    public function cancelled()
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'CANCELLED',
            'cancelled_at' => now(),
        ]);
    }
}
