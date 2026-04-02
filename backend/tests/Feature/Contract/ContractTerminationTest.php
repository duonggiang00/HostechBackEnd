<?php

namespace Tests\Feature\Contract;

use App\Features\Contract\Models\Contract;
use App\Features\Contract\Enums\ContractStatus;
use App\Features\Property\Models\Room;
use App\Features\Property\Models\Property;
use App\Features\Invoice\Models\Invoice;
use App\Models\User;
use App\Models\Organization\Organization;
use Spatie\Permission\Models\Role;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ContractTerminationTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_terminate_contract_with_forfeiture()
    {
        $org = Organization::factory()->create();
        $owner = User::factory()->create(['org_id' => $org->id]);
        $role = Role::firstOrCreate(['name' => 'Owner']);
        $owner->assignRole($role);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id, 'status' => 'occupied']);
        
        $contract = Contract::factory()->create([
            'property_id' => $property->id,
            'room_id' => $room->id,
            'org_id' => $org->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 10000000,
        ]);

        $terminationData = [
            'terminated_at' => now()->format('Y-m-d'),
            'forfeited_amount' => 5000000,
            'reason' => 'Vi phạm hợp đồng',
        ];

        $this->actingAs($owner);
        $response = $this->postJson("/api/contracts/{$contract->id}/terminate", $terminationData);

        $response->assertStatus(200);
        
        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertNotNull($contract->terminated_at);
        $this->assertEquals(5000000, $contract->forfeited_amount);
        
        $room->refresh();
        $this->assertEquals('available', $room->status);
    }
}
