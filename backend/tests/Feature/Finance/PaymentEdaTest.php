<?php

namespace Tests\Feature\Finance;

use App\Events\Finance\PaymentApproved;
use App\Events\Finance\PaymentVoided;
use App\Models\Invoice\Invoice;
use App\Models\Finance\Payment;
use App\Services\Finance\PaymentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

/**
 * Verifies that PaymentService correctly dispatches EDA events
 * instead of calling LedgerService directly.
 */
class PaymentEdaTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_dispatches_payment_approved_event(): void
    {
        Event::fake([PaymentApproved::class]);

        // Arrange
        $org      = \App\Models\Org\Org::factory()->create();
        \App\Services\TenantManager::setOrgId($org->id);

        $user     = \App\Models\Org\User::factory()->create(['org_id' => $org->id]);
        $property = \App\Models\Property\Property::factory()
            ->create(['org_id' => $org->id]);
        $floor    = \App\Models\Property\Floor::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room     = \App\Models\Property\Room::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);

        $contract = \App\Models\Contract\Contract::factory()
            ->create([
                'org_id'      => $org->id,
                'property_id' => $property->id,
                'room_id'     => $room->id,
            ]);

        $invoice  = Invoice::factory()
            ->create([
                'org_id'       => $org->id,
                'property_id'  => $property->id,
                'room_id'      => $room->id,
                'contract_id'  => $contract->id,
                'status'       => 'ISSUED',
                'total_amount' => 1000000,
                'paid_amount'  => 0,
            ]);

        /** @var PaymentService $service */
        $service = app(PaymentService::class);

        // Act
        $service->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'method'      => 'CASH',
            'amount'      => 1000000,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 1000000],
            ],
        ], $user);

        // Assert
        Event::assertDispatched(PaymentApproved::class, 1);
        Event::assertNotDispatched(PaymentVoided::class);
    }

    public function test_void_dispatches_payment_voided_event(): void
    {
        Event::fake([PaymentApproved::class, PaymentVoided::class]);

        // Arrange — create an approved payment with a real allocation
        $org      = \App\Models\Org\Org::factory()->create();
        \App\Services\TenantManager::setOrgId($org->id);

        $user     = \App\Models\Org\User::factory()->create(['org_id' => $org->id]);
        $property = \App\Models\Property\Property::factory()
            ->create(['org_id' => $org->id]);
        $floor    = \App\Models\Property\Floor::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room     = \App\Models\Property\Room::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);

        $contract = \App\Models\Contract\Contract::factory()
            ->create([
                'org_id'      => $org->id,
                'property_id' => $property->id,
                'room_id'     => $room->id,
            ]);

        $invoice  = Invoice::factory()
            ->create([
                'org_id'       => $org->id,
                'property_id'  => $property->id,
                'room_id'      => $room->id,
                'contract_id'  => $contract->id,
                'status'       => 'ISSUED',
                'total_amount' => 500000,
                'paid_amount'  => 0,
            ]);

        /** @var PaymentService $service */
        $service = app(PaymentService::class);

        $payment = $service->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'method'      => 'TRANSFER',
            'amount'      => 500000,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 500000],
            ],
        ], $user);

        // Reset fakes so we only count the void dispatch
        Event::fake([PaymentVoided::class]);

        // Act
        $freshPayment = Payment::find($payment->id);
        $service->void($freshPayment);

        // Assert
        Event::assertDispatched(PaymentVoided::class, 1);
        Event::assertNotDispatched(PaymentApproved::class);
    }

    public function test_create_does_not_directly_call_ledger_service(): void
    {
        Event::fake([PaymentApproved::class]);

        $org      = \App\Models\Org\Org::factory()->create();
        \App\Services\TenantManager::setOrgId($org->id);

        $user     = \App\Models\Org\User::factory()->create(['org_id' => $org->id]);
        $property = \App\Models\Property\Property::factory()
            ->create(['org_id' => $org->id]);
        $floor    = \App\Models\Property\Floor::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room     = \App\Models\Property\Room::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);

        $contract = \App\Models\Contract\Contract::factory()
            ->create([
                'org_id'      => $org->id,
                'property_id' => $property->id,
                'room_id'     => $room->id,
            ]);

        $invoice  = Invoice::factory()
            ->create([
                'org_id'       => $org->id,
                'property_id'  => $property->id,
                'room_id'      => $room->id,
                'contract_id'  => $contract->id,
                'status'       => 'ISSUED',
                'total_amount' => 200000,
                'paid_amount'  => 0,
            ]);

        /** @var PaymentService $service */
        $service = app(PaymentService::class);

        $service->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'method'      => 'CASH',
            'amount'      => 200000,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 200000],
            ],
        ], $user);

        // Ledger entries should NOT exist (Event::fake prevents listeners from running)
        $this->assertDatabaseMissing('ledger_entries', []);
    }
}
