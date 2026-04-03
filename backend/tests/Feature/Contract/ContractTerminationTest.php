<?php

namespace Tests\Feature\Contract;

use App\Features\Contract\Models\Contract;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use App\Models\Invoice\Invoice;
use App\Features\Contract\Enums\ContractStatus;
use App\Features\Contract\Enums\DepositStatus;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractTerminationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Tenant']);
        Role::firstOrCreate(['name' => 'Owner']);
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
            'status' => 'occupied'
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

        $terminationDate = now()->format('Y-m-d');

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => $terminationDate,
                'reason' => 'Normal termination',
                'forfeit_deposit' => false,
            ])
            ->assertStatus(200);

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
        $this->assertEquals($contract->rent_price, $invoice->total_amount);
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
            'status' => 'occupied'
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

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => now()->format('Y-m-d'),
                'reason' => 'Early termination with forfeiture',
                'forfeit_deposit' => true,
            ])
            ->assertStatus(200);

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertEquals(DepositStatus::FORFEITED, $contract->deposit_status);
        $this->assertEquals(5000000, $contract->forfeited_amount);

        // Verify termination invoice includes forfeiture if applicable
        $invoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();

        $this->assertNotNull($invoice);
    }
}
