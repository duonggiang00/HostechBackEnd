<?php

namespace Tests\Feature;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class TenantSelfServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Manager', 'guard_name' => 'web']);
        Role::firstOrCreate(['name' => 'Tenant', 'guard_name' => 'web']);

        // Register standard contract permissions that Policy checks
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'viewAny Contracts', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'view Contracts', 'guard_name' => 'web']);
        \Spatie\Permission\Models\Permission::firstOrCreate(['name' => 'update Contracts', 'guard_name' => 'web']);

        // Ensure roles have basic module access as per RbacModuleProvider expectations
        Role::findByName('Tenant', 'web')->givePermissionTo(['viewAny Contracts', 'view Contracts']);
        Role::findByName('Manager', 'web')->givePermissionTo(['viewAny Contracts', 'view Contracts', 'update Contracts']);
    }

    /** Setup a full active contract scenario */
    private function setupActiveContract(): array
    {
        $org = Org::create(['name' => 'Test Org']);

        $tenant = User::factory()->create(['org_id' => $org->id, 'full_name' => 'Primary Tenant']);
        $tenant->assignRole('Tenant');

        $property = Property::create(['org_id' => $org->id, 'name' => 'Tòa nhà A', 'code' => 'TNA']);

        $room = Room::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'name' => 'Phòng 101',
            'code' => 'P101',
            'status' => 'OCCUPIED',
        ]);

        $contract = Contract::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => 'ACTIVE',
            'start_date' => now()->toDateString(),
            'rent_price' => 5000000,
        ]);

        ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenant->id,
            'full_name' => $tenant->full_name,
            'status' => 'APPROVED',
            'is_primary' => true,
        ]);

        return [$org, $tenant, $property, $room, $contract];
    }

    // ─── FEATURE 1: Add Contract Member ─────────────────────────────────────

    public function test_tenant_can_add_roommate_to_their_contract()
    {
        [, $tenant, , , $contract] = $this->setupActiveContract();

        $response = $this->actingAs($tenant)->postJson('/api/contracts/'.$contract->id.'/members', [
            'full_name' => 'Bạn Cùng Phòng',
            'phone' => '0901111222',
            'role' => 'ROOMMATE',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.full_name', 'Bạn Cùng Phòng')
            ->assertJsonPath('data.status', 'PENDING')
            ->assertJsonPath('data.role', 'ROOMMATE');

        $this->assertDatabaseHas('contract_members', [
            'contract_id' => $contract->id,
            'full_name' => 'Bạn Cùng Phòng',
            'status' => 'PENDING',
            'is_primary' => false,
        ]);
    }

    public function test_non_member_tenant_cannot_add_to_others_contract()
    {
        [, , , , $contract] = $this->setupActiveContract();

        // Tenant khác cùng Org
        $otherOrg = Org::create(['name' => 'Other Org']);
        $stranger = User::factory()->create(['org_id' => $otherOrg->id, 'full_name' => 'Stranger']);
        $stranger->assignRole('Tenant');

        $response = $this->actingAs($stranger)->postJson('/api/contracts/'.$contract->id.'/members', [
            'full_name' => 'Hack Attempt',
            'role' => 'ROOMMATE',
        ]);

        $response->assertStatus(403);
    }

    // ─── FEATURE 2: View Available Rooms ────────────────────────────────────

    public function test_tenant_can_see_available_rooms_in_same_property()
    {
        [$org, $tenant, $property, , $contract] = $this->setupActiveContract();

        // Tạo thêm 2 phòng trống cùng tòa nhà
        Room::create(['org_id' => $org->id, 'property_id' => $property->id, 'name' => 'Phòng 201', 'code' => 'P201', 'status' => 'AVAILABLE']);
        Room::create(['org_id' => $org->id, 'property_id' => $property->id, 'name' => 'Phòng 202', 'code' => 'P202', 'status' => 'AVAILABLE']);
        // Phòng đang có hợp đồng (không được liệt kê)
        Room::create(['org_id' => $org->id, 'property_id' => $property->id, 'name' => 'Phòng 203', 'code' => 'P203', 'status' => 'OCCUPIED']);

        $response = $this->actingAs($tenant)->getJson('/api/contracts/'.$contract->id.'/available-rooms');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data') // Chỉ 2 phòng AVAILABLE
            ->assertJsonPath('property_name', 'Tòa nhà A');
    }

    public function test_tenant_cannot_see_rooms_from_other_property()
    {
        [$org, $tenant, , , $contract] = $this->setupActiveContract();

        // Tòa nhà khác
        $otherProperty = Property::create(['org_id' => $org->id, 'name' => 'Tòa nhà B', 'code' => 'TNB']);
        Room::create(['org_id' => $org->id, 'property_id' => $otherProperty->id, 'name' => 'Phòng B101', 'code' => 'B101', 'status' => 'AVAILABLE']);

        $response = $this->actingAs($tenant)->getJson('/api/contracts/'.$contract->id.'/available-rooms');
        $response->assertStatus(200)
            ->assertJsonCount(0, 'data'); // Không thấy phòng ở tòa nhà khác
    }

    // ─── FEATURE 3: Room Transfer Request ───────────────────────────────────

    public function test_tenant_can_request_room_transfer()
    {
        [$org, $tenant, $property, , $contract] = $this->setupActiveContract();

        $targetRoom = Room::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'name' => 'Phòng 301',
            'code' => 'P301',
            'status' => 'AVAILABLE',
        ]);

        $response = $this->actingAs($tenant)->postJson('/api/contracts/'.$contract->id.'/room-transfer-request', [
            'target_room_id' => $targetRoom->id,
            'reason' => 'Cần phòng rộng hơn',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('target_room.id', $targetRoom->id);

        // Verify meta được ghi vào contract
        $this->assertDatabaseHas('contracts', [
            'id' => $contract->id,
        ]);
        $updatedContract = Contract::find($contract->id);
        $this->assertNotEmpty($updatedContract->meta['transfer_requests']);
        $this->assertEquals('PENDING', $updatedContract->meta['transfer_requests'][0]['status']);
    }

    public function test_tenant_cannot_request_transfer_to_occupied_room()
    {
        [$org, $tenant, $property, , $contract] = $this->setupActiveContract();

        $occupiedRoom = Room::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'name' => 'Phòng Bận',
            'code' => 'PB01',
            'status' => 'OCCUPIED', // Không phải AVAILABLE
        ]);

        $response = $this->actingAs($tenant)->postJson('/api/contracts/'.$contract->id.'/room-transfer-request', [
            'target_room_id' => $occupiedRoom->id,
        ]);

        $response->assertStatus(422); // Phòng không hợp lệ
    }
}
