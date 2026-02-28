<?php

namespace Tests\Feature;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DormantTenantAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Roles and permissions required
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'viewAny Properties', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'viewAny Rooms', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'viewAny Room', 'guard_name' => 'web']); // Some policies use singular/plural mixed depending on your setup
        
        Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        $tenantRole = Role::firstOrCreate(['name' => 'Tenant', 'guard_name' => 'web']);
        
        // Tenants must legally have the basic view permission before the Eloquent tenant Contract Scope can kick in
        $tenantRole->givePermissionTo(['viewAny Properties', 'viewAny Rooms', 'viewAny Room']);
    }

    private function createTenant(): User
    {
        $org = Org::create(['name' => 'Real Estate Org']);
        $tenant = User::factory()->create([
            'org_id' => $org->id,
            'full_name' => 'John Doe'
        ]);
        $tenant->assignRole('Tenant');
        return $tenant;
    }

    private function setupContractScenario(User $tenant, string $status, string $memberStatus): array
    {
        $property = Property::create([
            'org_id' => $tenant->org_id,
            'name' => 'Test Property',
            'code' => 'T001'
        ]);

        $room = Room::create([
            'org_id' => $tenant->org_id,
            'property_id' => $property->id,
            'name' => 'Room 101',
            'code' => 'R101'
        ]);

        $contract = Contract::create([
            'org_id' => $tenant->org_id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => $status,
            'start_date' => now()->toDateString(),
            'rent_price' => 5000000,
        ]);

        ContractMember::create([
            'org_id' => $tenant->org_id,
            'contract_id' => $contract->id,
            'user_id' => $tenant->id,
            'status' => $memberStatus,
            'is_primary' => true,
            'full_name' => $tenant->full_name
        ]);

        return [$property, $room, $contract];
    }

    public function test_dormant_tenant_cannot_see_rooms_or_properties()
    {
        $tenant = $this->createTenant();

        // Let's create a scenario where tenant has a PENDING contract (Not APPROVED/ACTIVE)
        $this->setupContractScenario($tenant, 'DRAFT', 'PENDING');

        // Check Rooms API
        $responseRooms = $this->actingAs($tenant)->getJson('/api/rooms');
        $responseRooms->assertStatus(200)
             ->assertJsonCount(0, 'data'); // Empty result due to Scope filter

        // Check Properties API
        $responseProperties = $this->actingAs($tenant)->getJson('/api/properties');
        $responseProperties->assertStatus(200)
             ->assertJsonCount(0, 'data'); // Empty result due to Scope filter
    }

    public function test_tenant_can_see_pending_contracts()
    {
        $tenant = $this->createTenant();
        [$property, $room, $contract] = $this->setupContractScenario($tenant, 'DRAFT', 'PENDING');

        $response = $this->actingAs($tenant)->getJson('/api/contracts/my-pending');
        
        $response->assertStatus(200)
                 ->assertJsonCount(1, 'data')
                 ->assertJsonPath('data.0.id', $contract->id)
                 ->assertJsonMissingPath('data.0.join_code'); // Masked data test
    }

    public function test_tenant_can_accept_signature_and_unlock_access()
    {
        $tenant = $this->createTenant();
        [$property, $room, $contract] = $this->setupContractScenario($tenant, 'DRAFT', 'PENDING');

        // Accept Signature
        $acceptResponse = $this->actingAs($tenant)->postJson('/api/contracts/' . $contract->id . '/accept-signature');
        $acceptResponse->assertStatus(200);

        // Verify DB update
        $this->assertDatabaseHas('contract_members', [
            'contract_id' => $contract->id,
            'user_id' => $tenant->id,
            'status' => 'APPROVED',
        ]);
        $this->assertDatabaseHas('contracts', [
            'id' => $contract->id,
            'status' => 'ACTIVE',
        ]);

        // Attempt to fetch rooms now (Should be unlocked)
        $responseRooms = $this->actingAs($tenant)->getJson('/api/rooms');
        $responseRooms->assertStatus(200)
             ->assertJsonCount(1, 'data')
             ->assertJsonPath('data.0.id', $room->id);
    }

    public function test_tenant_can_reject_contract()
    {
         $tenant = $this->createTenant();
         [$property, $room, $contract] = $this->setupContractScenario($tenant, 'DRAFT', 'PENDING');
         
         $rejectResponse = $this->actingAs($tenant)->postJson('/api/contracts/' . $contract->id . '/reject-signature');
         $rejectResponse->assertStatus(200);
         
         $this->assertDatabaseHas('contract_members', [
             'contract_id' => $contract->id,
             'user_id' => $tenant->id,
             'status' => 'REJECTED',
         ]);
    }

    public function test_unrelated_tenant_cannot_sign_others_contract()
    {
        // Tenant 1 tạo hợp đồng
        $org = \App\Models\Org\Org::create(['name' => 'Shared Org']);
        $tenant1 = User::factory()->create(['org_id' => $org->id, 'full_name' => 'Tenant One']);
        $tenant1->assignRole('Tenant');

        // Tenant 2 là một người hoàn toàn khác trong cùng Org
        $tenant2 = User::factory()->create(['org_id' => $org->id, 'full_name' => 'Tenant Two']);
        $tenant2->assignRole('Tenant');

        [$property, $room, $contract] = $this->setupContractScenario($tenant1, 'DRAFT', 'PENDING');

        // Tenant 2 cố gắng ký hợp đồng của Tenant 1
        $response = $this->actingAs($tenant2)->postJson('/api/contracts/' . $contract->id . '/accept-signature');
        $response->assertStatus(403);
    }
}
