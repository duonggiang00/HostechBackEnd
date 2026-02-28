<?php

use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\Floor;
use App\Models\Org\User;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
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
                'condition' => 'Mới 100%'
            ]
        ]
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Assert asset created
    \App\Models\Property\RoomAsset::where('room_id', $id)->where('name', 'Tivi Samsung')->exists();
    
    // Assert price history created
    \App\Models\Property\RoomPrice::where('room_id', $id)->where('price', 500000)->exists();

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
    \App\Models\Property\RoomPrice::where('room_id', $id)->where('price', 600000)->exists();

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
        'status' => 'available'
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Update
    putJson("/api/rooms/{$id}", ['name' => 'Owner Updated'])
        ->assertStatus(200);

    // Delete
    deleteJson("/api/rooms/{$id}")->assertStatus(200);
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
        ->assertStatus(403);
});

