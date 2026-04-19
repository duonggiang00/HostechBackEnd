<?php

namespace Tests\Feature\Contract;

use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Enums\ContractCancellationParty;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DebtBreachTerminationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'Admin']);
    }

    public function test_it_terminates_contract_when_debt_equals_or_exceeds_deposit()
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied'
        ]);

        // Contract with 2,000,000 deposit
        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 2000000,
            'deposit_status' => DepositStatus::HELD,
        ]);

        // Create an unpaid invoice of 2,500,000 (Exceeds 2M deposit)
        $invoice = Invoice::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'contract_id' => $contract->id,
            'total_amount' => 2500000,
            'status' => 'ISSUED',
            'due_date' => now()->subDays(5),
            'issue_date' => now()->subDays(10),
            'period_start' => now()->subDays(30),
            'period_end' => now(),
        ]);

        // Run the artisan command
        $this->artisan('contracts:expire')
            ->expectsOutput('Đang kiểm tra các hợp đồng hết hạn và vi phạm dư nợ...')
            ->assertExitCode(0);

        // Verify contract is terminated
        $contract->refresh();
        $this->assertEquals(ContractStatus::CANCELLED, $contract->status);
        $this->assertEquals(DepositStatus::FORFEITED, $contract->deposit_status);
        $this->assertEquals(2000000, $contract->forfeited_amount);
        $this->assertEquals(ContractCancellationParty::SYSTEM, $contract->cancellation_party);
        
        // Verify settlement invoice exists
        $settlementInvoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();
            
        $this->assertNotNull($settlementInvoice);
        
        // Verify room is released
        $room->refresh();
        $this->assertEquals('available', $room->status);
    }

    public function test_it_does_not_terminate_contract_when_debt_is_less_than_deposit()
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'name' => 'Non-Breach Room',
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied'
        ]);

        // Contract with 5,000,000 deposit
        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
        ]);

        // Create an unpaid invoice of 1,000,000 (Below 5M deposit)
        Invoice::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'contract_id' => $contract->id,
            'total_amount' => 1000000,
            'status' => 'ISSUED',
            'due_date' => now()->subDays(5),
            'issue_date' => now()->subDays(10),
            'period_start' => now()->subDays(30),
            'period_end' => now(),
        ]);

        $this->artisan('contracts:expire');

        $contract->refresh();
        $this->assertEquals(ContractStatus::ACTIVE, $contract->status);
    }
}
