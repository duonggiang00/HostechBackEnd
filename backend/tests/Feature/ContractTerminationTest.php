<?php

namespace Tests\Feature;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Jobs\Contract\ProcessContractTerminationJob;
use App\Models\Contract\Contract;
use App\Models\Handover\Handover;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ContractTerminationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Tenant']);
    }

    public function test_admin_can_terminate_contract_without_forfeiture()
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'type' => 'CHECKOUT',
            'status' => 'CONFIRMED',
            'confirmed_at' => now(),
            'locked_at' => now(),
        ]);

        $terminationDate = now()->format('Y-m-d');

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => $terminationDate,
                'cancellation_party' => 'MUTUAL',
                'reason' => 'Normal termination',
                'forfeit_deposit' => false,
            ]);

        $response->assertStatus(202)
            ->assertJsonPath('processing_mode', 'async_eda');

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertEquals(DepositStatus::REFUND_PENDING, $contract->deposit_status);
        $this->assertNotNull($contract->terminated_at);

        $room->refresh();
        $this->assertEquals('available', $room->status);

        // Verify termination invoice
        $invoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();

        $this->assertNotNull($invoice);
        $this->assertGreaterThan(0, (float) $invoice->total_amount);
    }

    public function test_admin_can_terminate_contract_with_deposit_forfeiture()
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'type' => 'CHECKOUT',
            'status' => 'CONFIRMED',
            'confirmed_at' => now(),
            'locked_at' => now(),
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => now()->format('Y-m-d'),
                'reason' => 'Early termination with forfeiture',
                'forfeit_deposit' => true,
            ])
            ->assertStatus(202)
            ->assertJsonPath('processing_mode', 'async_eda');

        $contract->refresh();
        $this->assertContains($contract->status, [ContractStatus::TERMINATED, ContractStatus::PENDING_SETTLEMENT, ContractStatus::CANCELLED], 'Unexpected contract status after EDA termination');

        // Verify termination invoice includes forfeiture if applicable
        $invoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();

        $this->assertNotNull($invoice);
    }

    public function test_second_terminate_while_processing_returns_409(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'type' => 'CHECKOUT',
            'status' => 'CONFIRMED',
            'confirmed_at' => now(),
            'locked_at' => now(),
        ]);

        $payload = [
            'termination_date' => now()->format('Y-m-d'),
            'cancellation_party' => 'MUTUAL',
            'reason' => 'Normal termination',
            'forfeit_deposit' => false,
        ];

        $lock = Cache::lock(ProcessContractTerminationJob::terminationLockName($contract->id), 120);
        $this->assertTrue($lock->get());
        try {
            $this->actingAs($admin)
                ->postJson("/api/contracts/{$contract->id}/terminate", $payload)
                ->assertStatus(409);
        } finally {
            $lock->release();
        }
    }
}
