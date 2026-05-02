<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Models\Property\RoomFloorPlanNode;
use App\Models\Property\RoomPrice;
use App\Models\Property\RoomStatusHistory;
use Database\Seeders\RBACSeeder;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

test('admin can crud room', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    actingAs($admin);

    // Create
    $response = postJson('/api/rooms', [
        'property_id' => $property->id,
        'floor_id' => $floor->id,
        'code' => 'RM-TEST-01',
        'name' => 'Test Room',
        'base_price' => 500000,
        'status' => 'available',
        'assets' => [
            [
                'name' => 'Tivi Samsung',
                'serial' => 'SN-123456',
                'condition' => 'Mới 100%',
            ],
        ],
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Assert asset created
    RoomAsset::where('room_id', $id)->where('name', 'Tivi Samsung')->exists();

    // Assert price history created
    RoomPrice::where('room_id', $id)->where('price', 500000)->exists();

    // Read
    getJson("/api/rooms/{$id}")
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Test Room']);

    // Update
    putJson("/api/rooms/{$id}", [
        'name' => 'Updated Name',
        'base_price' => 600000, // Thay đổi giá
    ])
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Name']);

    // Assert new price history
    RoomPrice::where('room_id', $id)->where('price', 600000)->exists();

    // Delete
    deleteJson("/api/rooms/{$id}")->assertStatus(200);

    // Trash
    getJson('/api/rooms/trash')->assertStatus(200)->assertJsonFragment(['id' => $id]);
});

test('owner can crud room within org', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);
    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    actingAs($owner);

    // Create
    $response = postJson('/api/rooms', [
        'property_id' => $property->id,
        'floor_id' => $floor->id,
        'code' => 'RM-OWNER-01',
        'name' => 'Owner Room',
        'base_price' => 100,
        'status' => 'available',
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Update
    putJson("/api/rooms/{$id}", ['name' => 'Owner Updated'])
        ->assertStatus(200);

    // Delete
    deleteJson("/api/rooms/{$id}")->assertStatus(200);
});

test('staff cannot create update or delete room', function () {
    $org = Org::factory()->create();
    $staff = User::factory()->create(['org_id' => $org->id]);
    $staff->assignRole(Role::firstOrCreate(['name' => 'Staff']));
    $property = Property::factory()->create(['org_id' => $org->id]);
    $property->managers()->syncWithoutDetaching([(string) $staff->id]);
    $floor = Floor::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
    $room = Room::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_id' => $floor->id,
    ]);

    actingAs($staff);

    postJson('/api/rooms', [
        'property_id' => $property->id,
        'floor_id' => $floor->id,
        'code' => 'STAFF-BLOCK',
        'name' => 'Staff cannot create',
        'base_price' => 100,
        'area' => 20,
        'capacity' => 2,
        'status' => 'available',
    ])->assertStatus(403);

    putJson("/api/rooms/{$room->id}", ['name' => 'Should not apply'])->assertStatus(403);

    deleteJson("/api/rooms/{$room->id}")->assertStatus(403);
});

test('owner cannot access other org room', function () {
    $org1 = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org1->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $org2 = Org::factory()->create();
    $prop2 = Property::factory()->create(['org_id' => $org2->id]);
    $floor2 = Floor::factory()->create(['property_id' => $prop2->id, 'org_id' => $org2->id]);
    $room2 = Room::factory()->create(['floor_id' => $floor2->id, 'property_id' => $prop2->id, 'org_id' => $org2->id]);

    actingAs($owner)
        ->getJson("/api/rooms/{$room2->id}")
        ->assertStatus(404); // Not Found due to MultiTenant global scope
});

test('quick create creates a draft room with minimal data', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);

    actingAs($admin);

    $response = postJson('/api/rooms/quick', [
        'property_id' => $property->id,
        'name' => 'Phòng Nhanh Test',
    ]);

    $response->assertStatus(201)
        ->assertJsonFragment(['status' => 'draft'])
        ->assertJsonFragment(['is_draft' => true])
        ->assertJsonFragment(['name' => 'Phòng Nhanh Test']);

    // Không ghi RoomPrice hay RoomStatusHistory khi draft
    $id = $response->json('data.id');
    expect(RoomPrice::where('room_id', $id)->count())->toBe(0);
    expect(RoomStatusHistory::where('room_id', $id)->count())->toBe(0);
});

test('publish transitions draft room to available', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);

    actingAs($admin);

    // Tạo room draft trước
    $draftResponse = postJson('/api/rooms/quick', [
        'property_id' => $property->id,
        'name' => 'Draft Room',
    ]);
    $id = $draftResponse->json('data.id');

    // Publish với code và giá
    $publishResponse = postJson("/api/rooms/{$id}/publish", [
        'code' => 'P.PUBLISH-01',
        'base_price' => 3000000,
    ]);

    $publishResponse->assertStatus(200)
        ->assertJsonFragment(['status' => 'available'])
        ->assertJsonFragment(['is_draft' => false]);

    // Sau publish phải có RoomPrice và RoomStatusHistory
    expect(RoomPrice::where('room_id', $id)->count())->toBe(1);
    expect(RoomStatusHistory::where('room_id', $id)->count())->toBe(1);

    // Không thể publish lần 2
    postJson("/api/rooms/{$id}/publish", ['base_price' => 1000])
        ->assertStatus(422);
});

test('owner room index returns primary_tenant when active contract exists', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole(Role::firstOrCreate(['name' => 'Owner']));

    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $occupiedRoom = Room::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_id' => $floor->id,
        'status' => 'occupied',
    ]);
    $vacantRoom = Room::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_id' => $floor->id,
        'status' => 'available',
    ]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $occupiedRoom->id,
        'status' => 'ACTIVE',
    ]);
    ContractMember::factory()->create([
        'org_id' => $org->id,
        'contract_id' => $contract->id,
        'full_name' => 'Nguyễn Văn A',
        'phone' => '0900000000',
        'role' => 'TENANT',
        'is_primary' => true,
    ]);

    actingAs($owner);

    $response = getJson('/api/rooms?per_page=20')->assertSuccessful();
    $rooms = collect($response->json('data'));

    $occupiedPayload = $rooms->firstWhere('id', $occupiedRoom->id);
    expect($occupiedPayload)->not->toBeNull();
    expect($occupiedPayload['primary_tenant'])->not->toBeNull();
    expect($occupiedPayload['primary_tenant']['full_name'])->toBe('Nguyễn Văn A');

    $vacantPayload = $rooms->firstWhere('id', $vacantRoom->id);
    expect($vacantPayload)->not->toBeNull();
    expect($vacantPayload['primary_tenant'])->toBeNull();
});

test('floor plan node can be set and removed', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
    $room = Room::factory()->create([
        'property_id' => $property->id,
        'org_id' => $org->id,
        'floor_id' => $floor->id,
    ]);

    actingAs($admin);

    // Gán vị trí
    putJson("/api/rooms/{$room->id}/floor-plan", [
        'floor_id' => $floor->id,
        'x' => 10.5,
        'y' => 20.0,
        'width' => 120,
        'height' => 80,
        'label' => 'P.101',
    ])->assertStatus(200)
        ->assertJsonFragment(['message' => 'Floor plan node updated successfully.']);

    // Xác nhận bản ghi tồn tại trong DB
    expect(RoomFloorPlanNode::where('room_id', $room->id)->count())->toBe(1);

    // Xóa vị trí
    deleteJson("/api/rooms/{$room->id}/floor-plan")
        ->assertStatus(200)
        ->assertJsonFragment(['message' => 'Floor plan node removed successfully.']);
});
