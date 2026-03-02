<?php

namespace Tests\Feature\Handover;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Meter\Meter;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Handover Module — Comprehensive Test Suite
 *
 * Covers:
 *  - RBAC per role (Owner, Manager, Staff, Tenant)
 *  - Org scope isolation (users from other orgs are blocked)
 *  - Tenant requesting a PENDING handover (CHECKIN/CHECKOUT self-service)
 *  - DRAFT → CONFIRMED flow and locking
 *  - Items CRUD (only on DRAFT)
 *  - Meter Snapshots CRUD (only on DRAFT)
 */
class HandoverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Chạy lệnh rbac:sync để tạo permissions và sync role dựa vào Policy
        $this->artisan('rbac:sync');

        // Flush Spatie permission cache so assignRole() takes effect immediately
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private function setupOrg(): array
    {
        $org = Org::create(['name' => 'Test Org ' . uniqid()]);
        $property = Property::create(['org_id' => $org->id, 'name' => 'Tòa A', 'code' => 'TA' . uniqid()]);
        $floor = Floor::create(['org_id' => $org->id, 'property_id' => $property->id, 'name' => '1', 'floor_number' => 1]);
        $room = Room::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id,
            'name' => 'Phòng 101', 'code' => 'P' . uniqid(), 'status' => 'OCCUPIED',
        ]);
        $contract = Contract::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
            'status' => 'ACTIVE', 'start_date' => now()->toDateString(), 'rent_price' => 5000000,
        ]);
        return [$org, $property, $floor, $room, $contract];
    }

    private function makeUser(Org $org, string $role): User
    {
        $user = User::factory()->create(['org_id' => $org->id, 'full_name' => "User {$role}"]);
        // Only assign PascalCase to match RbacSyncCommand output
        $user->assignRole($role);
        // Flush cache after each role assignment
        app(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions();
        return $user;
    }

    private function makeApprovedTenant(Org $org, Contract $contract): User
    {
        $tenant = $this->makeUser($org, 'Tenant');
        ContractMember::create([
            'org_id' => $org->id, 'contract_id' => $contract->id,
            'user_id' => $tenant->id, 'full_name' => $tenant->full_name,
            'status' => 'APPROVED', 'is_primary' => true,
        ]);
        return $tenant;
    }

    private function makeHandover(Org $org, Room $room, Contract $contract, string $type = 'CHECKIN', string $status = 'DRAFT'): Handover
    {
        return Handover::create([
            'org_id' => $org->id, 'room_id' => $room->id,
            'contract_id' => $contract->id, 'type' => $type, 'status' => $status,
        ]);
    }

    // ─── 1. RBAC — CREATE ────────────────────────────────────────────────────

    public function test_owner_can_create_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $owner = $this->makeUser($org, 'Owner');

        $response = $this->actingAs($owner)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id, 'type' => 'CHECKIN',
        ]);

        $response->assertStatus(201); // Controller returns Resource without explicit 201
        $this->assertDatabaseHas('handovers', ['org_id' => $org->id, 'type' => 'CHECKIN', 'status' => 'DRAFT']);
    }

    public function test_manager_can_create_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $this->actingAs($manager)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id, 'type' => 'CHECKIN',
        ])->assertStatus(201);
    }

    public function test_staff_can_create_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $staff = $this->makeUser($org, 'Staff');

        $this->actingAs($staff)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id, 'type' => 'CHECKIN',
        ])->assertStatus(201);
    }

    public function test_tenant_cannot_create_handover_directly()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $tenant = $this->makeApprovedTenant($org, $contract);

        // Tenant via normal create endpoint → should be FORBIDDEN
        $this->actingAs($tenant)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id, 'type' => 'CHECKIN',
        ])->assertForbidden();
    }

    // ─── 2. Org Scope Isolation ───────────────────────────────────────────────

    public function test_manager_from_other_org_cannot_see_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $handover = $this->makeHandover($org, $room, $contract);

        // Manager từ org khác
        $otherOrg = Org::create(['name' => 'Other Org']);
        $outsider = $this->makeUser($otherOrg, 'Manager');

        $this->actingAs($outsider)->getJson('/api/handovers/' . $handover->id)
             ->assertForbidden();
    }

    public function test_index_only_returns_handovers_from_own_org()
    {
        [$org1, , , $room1, $contract1] = $this->setupOrg();
        [$org2, , , $room2, $contract2] = $this->setupOrg();

        $this->makeHandover($org1, $room1, $contract1);

        $manager1 = $this->makeUser($org1, 'Manager');
        $manager2 = $this->makeUser($org2, 'Manager');

        // Manager của org1 thấy 1 handover
        $this->actingAs($manager1)->getJson('/api/handovers')
             ->assertStatus(200)
             ->assertJsonCount(1, 'data');

        // Manager của org2 thấy 0 handover
        $this->actingAs($manager2)->getJson('/api/handovers')
             ->assertStatus(200)
             ->assertJsonCount(0, 'data');
    }

    // ─── 3. Tenant Self-Service — Yêu cầu bàn giao (PENDING) ────────────────
    // Note: Theo luồng đề xuất, Tenant submit qua endpoint riêng → status PENDING
    // HandoverPolicy.view() cho phép Tenant xem CONFIRMED handover của hợp đồng mình

    public function test_tenant_can_view_confirmed_handover_of_own_contract()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $tenant = $this->makeApprovedTenant($org, $contract);
        $handover = $this->makeHandover($org, $room, $contract, 'CHECKIN', 'CONFIRMED');

        $this->actingAs($tenant)->getJson('/api/handovers/' . $handover->id)
             ->assertStatus(200)
             ->assertJsonPath('data.status', 'CONFIRMED');
    }

    public function test_tenant_cannot_view_draft_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $tenant = $this->makeApprovedTenant($org, $contract);
        $handover = $this->makeHandover($org, $room, $contract, 'CHECKIN', 'DRAFT');

        // DRAFT chưa được Tenant xem (chưa confirm)
        $this->actingAs($tenant)->getJson('/api/handovers/' . $handover->id)
             ->assertForbidden();
    }

    public function test_tenant_cannot_view_confirmed_handover_of_another_contract()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        [$org2, , , $room2, $contract2] = $this->setupOrg();

        $tenant = $this->makeApprovedTenant($org, $contract);
        // Handover thuộc contract2, Tenant chỉ có contract1
        $otherHandover = $this->makeHandover($org2, $room2, $contract2, 'CHECKIN', 'CONFIRMED');

        $this->actingAs($tenant)->getJson('/api/handovers/' . $otherHandover->id)
             ->assertForbidden();
    }

    // ─── 4. DRAFT → CONFIRMED Flow ───────────────────────────────────────────

    public function test_manager_can_confirm_draft_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/confirm')
             ->assertStatus(200)
             ->assertJsonPath('data.status', 'CONFIRMED');

        $this->assertDatabaseHas('handovers', [
            'id' => $handover->id,
            'status' => 'CONFIRMED',
            'confirmed_by_user_id' => $manager->id,
        ]);
    }

    public function test_cannot_confirm_already_confirmed_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract, 'CHECKIN', 'CONFIRMED');
        $handover->update(['locked_at' => now()]);

        // Confirm lần 2 → 403 (policy block)
        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/confirm')
             ->assertStatus(403);
    }

    public function test_cannot_update_confirmed_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract, 'CHECKIN', 'CONFIRMED');
        $handover->update(['locked_at' => now()]);

        $this->actingAs($manager)->putJson('/api/handovers/' . $handover->id, ['note' => 'Cố tình sửa'])
             ->assertStatus(403); // hoặc 403
    }

    // ─── 5. Items CRUD ────────────────────────────────────────────────────────

    public function test_manager_can_add_item_to_draft_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/items', [
            'name' => 'Điều hòa Daikin 12000 BTU',
            'status' => 'OK',
            'note' => 'Mới 100%',
        ])->assertStatus(201);

        $this->assertDatabaseHas('handover_items', [
            'handover_id' => $handover->id,
            'name' => 'Điều hòa Daikin 12000 BTU',
            'status' => 'OK',
        ]);
    }

    public function test_manager_can_update_item_status_to_damaged()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $item = HandoverItem::create([
            'org_id' => $org->id, 'handover_id' => $handover->id,
            'name' => 'Tủ lạnh', 'status' => 'OK',
        ]);

        $this->actingAs($manager)->putJson(
            '/api/handovers/' . $handover->id . '/items/' . $item->id,
            ['name' => 'Tủ lạnh', 'status' => 'DAMAGED', 'note' => 'Vỡ cánh cửa']
        )->assertStatus(200)
         ->assertJsonPath('data.status', 'DAMAGED');
    }

    public function test_cannot_add_item_to_confirmed_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract, 'CHECKIN', 'CONFIRMED');
        $handover->update(['locked_at' => now()]);

        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/items', [
            'name' => 'Ghế mây', 'status' => 'OK',
        ])->assertStatus(422);
    }

    public function test_manager_can_delete_item_from_draft_handover()
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $item = HandoverItem::create([
            'org_id' => $org->id, 'handover_id' => $handover->id,
            'name' => 'Quạt trần', 'status' => 'MISSING',
        ]);

        $this->actingAs($manager)->deleteJson('/api/handovers/' . $handover->id . '/items/' . $item->id)
             ->assertNoContent();

        $this->assertDatabaseMissing('handover_items', ['id' => $item->id]);
    }

    // ─── 6. Meter Snapshots CRUD ─────────────────────────────────────────────

    public function test_manager_can_add_meter_snapshot()
    {
        [$org, $property, $floor, $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $meter = \App\Models\Meter\Meter::create([
            'org_id' => $org->id, 'room_id' => $room->id,
            'type' => 'ELECTRICITY', 'code' => 'EL-001',
        ]);

        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/snapshots', [
            'meter_id' => $meter->id,
            'reading_value' => 1234,
        ])->assertStatus(201)
          ->assertJsonPath('data.reading_value', 1234);

        $this->assertDatabaseHas('handover_meter_snapshots', [
            'handover_id' => $handover->id, 'meter_id' => $meter->id, 'reading_value' => 1234,
        ]);
    }

    public function test_adding_same_meter_snapshot_twice_updates_existing()
    {
        [$org, $property, $floor, $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $meter = \App\Models\Meter\Meter::create([
            'org_id' => $org->id, 'room_id' => $room->id,
            'type' => 'WATER', 'code' => 'W-001',
        ]);

        $handover = $this->makeHandover($org, $room, $contract);

        // First snapshot
        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/snapshots', [
            'meter_id' => $meter->id, 'reading_value' => 100,
        ])->assertStatus(201);
        // Second call with same meter_id → updateOrCreate (still 200)
        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/snapshots', [
            'meter_id' => $meter->id, 'reading_value' => 150,
        ])->assertStatus(200); // 2nd call is an update so it can be 200

        // Chỉ có 1 snapshot cho meter này
        $this->assertDatabaseCount('handover_meter_snapshots', 1);
        $this->assertDatabaseHas('handover_meter_snapshots', ['reading_value' => 150]);
    }

    public function test_cannot_add_snapshot_to_confirmed_handover()
    {
        [$org, $property, , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $meter = \App\Models\Meter\Meter::create([
            'org_id' => $org->id, 'room_id' => $room->id,
            'type' => 'ELECTRICITY', 'code' => 'EL-002',
        ]);

        $handover = $this->makeHandover($org, $room, $contract, 'CHECKIN', 'CONFIRMED');
        $handover->update(['locked_at' => now()]);

        $this->actingAs($manager)->postJson('/api/handovers/' . $handover->id . '/snapshots', [
            'meter_id' => $meter->id, 'reading_value' => 999,
        ])->assertStatus(422);
    }

    // ─── 7. Full CHECKOUT Flow ────────────────────────────────────────────────

    public function test_full_checkout_flow_draft_to_confirmed()
    {
        [$org, $property, , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $tenant = $this->makeApprovedTenant($org, $contract);

        $meter = \App\Models\Meter\Meter::create([
            'org_id' => $org->id, 'room_id' => $room->id,
            'type' => 'ELECTRICITY', 'code' => 'EL-003',
        ]);

        // 1. Tạo CHECKOUT handover
        $res = $this->actingAs($manager)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id,
            'type' => 'CHECKOUT', 'note' => 'Trả phòng cuối tháng',
        ]);
        $res->assertStatus(201);
        $handoverId = $res->json('data.id');

        // 2. Thêm item kiểm kê
        $this->actingAs($manager)->postJson("/api/handovers/{$handoverId}/items", [
            'name' => 'Máy lạnh', 'status' => 'OK',
        ])->assertStatus(201);

        // 3. Chụp chỉ số đồng hồ
        $this->actingAs($manager)->postJson("/api/handovers/{$handoverId}/snapshots", [
            'meter_id' => $meter->id, 'reading_value' => 5000,
        ])->assertStatus(201);

        // 4. Confirm (khóa biên bản)
        $this->actingAs($manager)->postJson("/api/handovers/{$handoverId}/confirm")
             ->assertStatus(200)
             ->assertJsonPath('data.status', 'CONFIRMED');

        // 5. Tenant có thể xem biên bản đã confirm
        $this->actingAs($tenant)->getJson("/api/handovers/{$handoverId}")
             ->assertStatus(200)
             ->assertJsonPath('data.status', 'CONFIRMED');
    }
}
