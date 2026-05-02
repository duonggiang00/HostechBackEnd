<?php

namespace Tests\Feature\Handover;

use App\Enums\ContractStatus;
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
use App\Models\Property\RoomAsset;
use App\Services\Handover\HandoverService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

/**
 * Handover Module — RBAC, org scope, items/snapshots theo trạng thái hợp đồng.
 */
class HandoverTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->artisan('rbac:sync');
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    private function setupOrg(): array
    {
        $org = Org::create(['name' => 'Test Org '.uniqid()]);
        $property = Property::create(['org_id' => $org->id, 'name' => 'Tòa A', 'code' => 'TA'.uniqid()]);
        $floor = Floor::create(['org_id' => $org->id, 'property_id' => $property->id, 'name' => '1', 'sort_order' => 1]);
        $room = Room::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id,
            'name' => 'Phòng 101', 'code' => 'P'.uniqid(), 'status' => 'OCCUPIED',
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
        $user->assignRole($role);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

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

    private function makeHandover(Org $org, Room $room, Contract $contract, ?string $createdByUserId = null): Handover
    {
        return Handover::create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'contract_id' => $contract->id,
            'created_by_user_id' => $createdByUserId,
        ]);
    }

    public function test_owner_can_create_handover(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $owner = $this->makeUser($org, 'Owner');

        $response = $this->actingAs($owner)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('handovers', ['org_id' => $org->id, 'contract_id' => $contract->id]);
    }

    public function test_manager_can_create_handover(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $this->actingAs($manager)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id,
        ])->assertOk();
    }

    public function test_staff_can_create_handover(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $staff = $this->makeUser($org, 'Staff');

        $this->actingAs($staff)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id,
        ])->assertOk();
    }

    public function test_tenant_cannot_create_handover_directly(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $tenant = $this->makeApprovedTenant($org, $contract);

        $this->actingAs($tenant)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id,
        ])->assertForbidden();
    }

    public function test_manager_from_other_org_cannot_see_handover(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $handover = $this->makeHandover($org, $room, $contract);

        $otherOrg = Org::create(['name' => 'Other Org']);
        $outsider = $this->makeUser($otherOrg, 'Manager');

        $this->actingAs($outsider)->getJson('/api/handovers/'.$handover->id)
            ->assertForbidden();
    }

    public function test_index_only_returns_handovers_from_own_org(): void
    {
        [$org1, , , $room1, $contract1] = $this->setupOrg();
        [$org2, , , $room2, $contract2] = $this->setupOrg();

        $this->makeHandover($org1, $room1, $contract1);

        $manager1 = $this->makeUser($org1, 'Manager');
        $manager2 = $this->makeUser($org2, 'Manager');

        $this->actingAs($manager1)->getJson('/api/handovers')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data');

        $this->actingAs($manager2)->getJson('/api/handovers')
            ->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    public function test_tenant_can_view_handover_of_own_contract(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $tenant = $this->makeApprovedTenant($org, $contract);
        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($tenant)->getJson('/api/handovers/'.$handover->id)
            ->assertStatus(200)
            ->assertJsonPath('data.id', $handover->id);
    }

    public function test_tenant_cannot_view_handover_of_another_contract(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        [$org2, , , $room2, $contract2] = $this->setupOrg();

        $tenant = $this->makeApprovedTenant($org, $contract);
        $otherHandover = $this->makeHandover($org2, $room2, $contract2);

        $this->actingAs($tenant)->getJson('/api/handovers/'.$otherHandover->id)
            ->assertForbidden();
    }

    public function test_cannot_update_handover_when_contract_terminated(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $contract->update(['status' => ContractStatus::TERMINATED]);

        $this->actingAs($manager)->putJson('/api/handovers/'.$handover->id, ['note' => 'Cố tình sửa'])
            ->assertForbidden();
    }

    public function test_manager_can_add_item_while_contract_active(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($manager)->postJson('/api/handovers/'.$handover->id.'/items', [
            'name' => 'Điều hòa Daikin 12000 BTU',
            'condition' => 'OK',
            'note' => 'Mới 100%',
        ])->assertSuccessful();

        $this->assertDatabaseHas('handover_items', [
            'handover_id' => $handover->id,
            'name' => 'Điều hòa Daikin 12000 BTU',
            'condition' => 'OK',
        ]);
    }

    public function test_manager_can_update_item_condition(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $item = HandoverItem::create([
            'org_id' => $org->id, 'handover_id' => $handover->id,
            'name' => 'Tủ lạnh', 'condition' => 'OK',
        ]);

        $this->actingAs($manager)->putJson(
            '/api/handovers/'.$handover->id.'/items/'.$item->id,
            ['condition' => 'DAMAGED', 'note' => 'Vỡ cánh cửa']
        )->assertStatus(200)
            ->assertJsonPath('data.condition', 'DAMAGED');
    }

    public function test_cannot_add_item_when_contract_terminated(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);
        $contract->update(['status' => ContractStatus::TERMINATED]);

        $this->actingAs($manager)->postJson('/api/handovers/'.$handover->id.'/items', [
            'name' => 'Ghế mây', 'condition' => 'OK',
        ])->assertForbidden();
    }

    public function test_manager_can_delete_item_from_handover(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $handover = $this->makeHandover($org, $room, $contract);

        $item = HandoverItem::create([
            'org_id' => $org->id, 'handover_id' => $handover->id,
            'name' => 'Quạt trần', 'condition' => 'MISSING',
        ]);

        $this->actingAs($manager)->deleteJson('/api/handovers/'.$handover->id.'/items/'.$item->id)
            ->assertNoContent();

        $this->assertSoftDeleted('handover_items', ['id' => $item->id]);
    }

    public function test_manager_can_add_meter_snapshot(): void
    {
        [$org, $property, $floor, $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $meter = Meter::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
            'type' => 'ELECTRICITY', 'code' => 'EL-001',
        ]);

        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($manager)->postJson('/api/handovers/'.$handover->id.'/snapshots', [
            'meter_id' => $meter->id,
            'reading_value' => 1234,
        ])->assertSuccessful()
            ->assertJsonPath('data.reading_value', 1234);

        $this->assertDatabaseHas('handover_meter_snapshots', [
            'handover_id' => $handover->id, 'meter_id' => $meter->id, 'reading_value' => 1234,
        ]);
    }

    public function test_adding_same_meter_snapshot_twice_updates_existing(): void
    {
        [$org, $property, $floor, $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $meter = Meter::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
            'type' => 'WATER', 'code' => 'W-001',
        ]);

        $handover = $this->makeHandover($org, $room, $contract);

        $this->actingAs($manager)->postJson('/api/handovers/'.$handover->id.'/snapshots', [
            'meter_id' => $meter->id, 'reading_value' => 100,
        ])->assertSuccessful();
        $this->actingAs($manager)->postJson('/api/handovers/'.$handover->id.'/snapshots', [
            'meter_id' => $meter->id, 'reading_value' => 150,
        ])->assertSuccessful();

        $this->assertDatabaseCount('handover_meter_snapshots', 1);
        $this->assertDatabaseHas('handover_meter_snapshots', ['reading_value' => 150]);
    }

    public function test_cannot_add_snapshot_when_contract_terminated(): void
    {
        [$org, $property, , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');

        $meter = Meter::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
            'type' => 'ELECTRICITY', 'code' => 'EL-002',
        ]);

        $handover = $this->makeHandover($org, $room, $contract);
        $contract->update(['status' => ContractStatus::TERMINATED]);

        $this->actingAs($manager)->postJson('/api/handovers/'.$handover->id.'/snapshots', [
            'meter_id' => $meter->id, 'reading_value' => 999,
        ])->assertForbidden();
    }

    public function test_full_handover_flow_without_confirm_route(): void
    {
        [$org, $property, , $room, $contract] = $this->setupOrg();
        $manager = $this->makeUser($org, 'Manager');
        $tenant = $this->makeApprovedTenant($org, $contract);

        $meter = Meter::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
            'type' => 'ELECTRICITY', 'code' => 'EL-003',
        ]);

        $res = $this->actingAs($manager)->postJson('/api/handovers', [
            'room_id' => $room->id, 'contract_id' => $contract->id,
            'note' => 'Trả phòng cuối tháng',
        ]);
        $res->assertOk();
        $handoverId = $res->json('data.id');

        $this->actingAs($manager)->postJson("/api/handovers/{$handoverId}/items", [
            'name' => 'Máy lạnh', 'condition' => 'OK',
        ])->assertSuccessful();

        $this->actingAs($manager)->postJson("/api/handovers/{$handoverId}/snapshots", [
            'meter_id' => $meter->id, 'reading_value' => 5000,
        ])->assertSuccessful();

        $this->actingAs($tenant)->getJson("/api/handovers/{$handoverId}")
            ->assertStatus(200);
    }

    public function test_termination_handover_get_does_not_insert_handover_row(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $asset = RoomAsset::create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'name' => 'Quạt trần',
        ]);
        $owner = $this->makeUser($org, 'Owner');

        $response = $this->actingAs($owner)->getJson("/api/contracts/{$contract->id}/termination-handover");

        $response->assertOk();
        $response->assertJsonPath('data.persisted', false);
        $response->assertJsonPath('data.handover', null);
        $this->assertSame(HandoverService::DEFAULT_TERMINATION_HANDOVER_NOTE, $response->json('data.default_handover_note'));
        $this->assertCount(1, $response->json('data.items'));
        $this->assertSame($asset->id, $response->json('data.items.0.room_asset_id'));
        $this->assertSame(0, Handover::query()->where('contract_id', $contract->id)->count());
    }

    public function test_termination_handover_post_commits_draft_to_database(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        $asset = RoomAsset::create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'name' => 'Bàn làm việc',
        ]);
        $owner = $this->makeUser($org, 'Owner');

        $this->actingAs($owner)->getJson("/api/contracts/{$contract->id}/termination-handover")->assertOk();

        $commit = $this->actingAs($owner)->postJson("/api/contracts/{$contract->id}/termination-handover", [
            'note' => 'Ghi chú chung cho biên bản.',
            'items' => [
                [
                    'room_asset_id' => $asset->id,
                    'condition' => 'DAMAGED',
                ],
            ],
        ]);

        $commit->assertOk();
        $commit->assertJsonPath('data.persisted', true);
        $this->assertSame(1, Handover::query()->where('contract_id', $contract->id)->count());

        $item = HandoverItem::query()->where('room_asset_id', $asset->id)->first();
        $this->assertNotNull($item);
        $this->assertSame('DAMAGED', $item->condition);
        $this->assertNull($item->note);

        $handover = Handover::query()->where('contract_id', $contract->id)->first();
        $this->assertSame('Ghi chú chung cho biên bản.', $handover->note);
    }

    public function test_termination_handover_commit_uses_default_note_when_note_omitted(): void
    {
        [$org, , , $room, $contract] = $this->setupOrg();
        RoomAsset::create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'name' => 'Kệ sách',
        ]);
        $owner = $this->makeUser($org, 'Owner');

        $this->actingAs($owner)->postJson("/api/contracts/{$contract->id}/termination-handover", [
            'items' => [],
        ])->assertOk();

        $handover = Handover::query()->where('contract_id', $contract->id)->first();
        $this->assertSame(HandoverService::DEFAULT_TERMINATION_HANDOVER_NOTE, $handover->note);
    }
}
