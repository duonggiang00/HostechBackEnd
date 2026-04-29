<?php

namespace Tests\Feature\Finance;

use App\Events\Finance\PaymentSuccessfullyVerified;
use App\Events\Finance\PaymentVoided;
use App\Models\Contract\Contract;
use App\Models\Finance\Payment;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Finance\PaymentService;
use App\Services\TenantManager;
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
        Event::fake([PaymentSuccessfullyVerified::class]);

        // Arrange
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $user = User::factory()->create(['org_id' => $org->id]);
        $property = Property::factory()
            ->create(['org_id' => $org->id]);
        $floor = Floor::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room = Room::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);

        $contract = Contract::factory()
            ->create([
                'org_id' => $org->id,
                'property_id' => $property->id,
                'room_id' => $room->id,
            ]);

        $invoice = Invoice::factory()
            ->create([
                'org_id' => $org->id,
                'property_id' => $property->id,
                'room_id' => $room->id,
                'contract_id' => $contract->id,
                'status' => 'ISSUED',
                'total_amount' => 1000000,
                'paid_amount' => 0,
            ]);

        /** @var PaymentService $service */
        $service = app(PaymentService::class);

        // Act
        $service->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'method' => 'CASH',
            'amount' => 1000000,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 1000000],
            ],
        ], $user);

        // Assert
        Event::assertDispatched(PaymentSuccessfullyVerified::class, 1);
        Event::assertNotDispatched(PaymentVoided::class);
    }

    public function test_void_dispatches_payment_voided_event(): void
    {
        Event::fake([PaymentSuccessfullyVerified::class, PaymentVoided::class]);

        // Arrange — create an approved payment with a real allocation
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $user = User::factory()->create(['org_id' => $org->id]);
        $property = Property::factory()
            ->create(['org_id' => $org->id]);
        $floor = Floor::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room = Room::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);

        $contract = Contract::factory()
            ->create([
                'org_id' => $org->id,
                'property_id' => $property->id,
                'room_id' => $room->id,
            ]);

        $invoice = Invoice::factory()
            ->create([
                'org_id' => $org->id,
                'property_id' => $property->id,
                'room_id' => $room->id,
                'contract_id' => $contract->id,
                'status' => 'ISSUED',
                'total_amount' => 500000,
                'paid_amount' => 0,
            ]);

        /** @var PaymentService $service */
        $service = app(PaymentService::class);

        $payment = $service->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'method' => 'TRANSFER',
            'amount' => 500000,
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
        Event::assertNotDispatched(PaymentSuccessfullyVerified::class);
    }

    public function test_create_does_not_directly_call_ledger_service(): void
    {
        Event::fake([PaymentSuccessfullyVerified::class]);

        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $user = User::factory()->create(['org_id' => $org->id]);
        $property = Property::factory()
            ->create(['org_id' => $org->id]);
        $floor = Floor::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room = Room::factory()
            ->create(['org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id]);

        $contract = Contract::factory()
            ->create([
                'org_id' => $org->id,
                'property_id' => $property->id,
                'room_id' => $room->id,
            ]);

        $invoice = Invoice::factory()
            ->create([
                'org_id' => $org->id,
                'property_id' => $property->id,
                'room_id' => $room->id,
                'contract_id' => $contract->id,
                'status' => 'ISSUED',
                'total_amount' => 200000,
                'paid_amount' => 0,
            ]);

        /** @var PaymentService $service */
        $service = app(PaymentService::class);

        $service->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'method' => 'CASH',
            'amount' => 200000,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => 200000],
            ],
        ], $user);

        // Ledger entries should NOT exist (Event::fake prevents listeners from running)
        $this->assertDatabaseMissing('ledger_entries', []);
    }
}
