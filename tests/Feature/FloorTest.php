<?php

use App\Models\Org\Org;
use App\Models\Property\Property;
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

test('admin can crud floor', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);

    actingAs($admin);

    // Create
    $response = postJson('/api/floors', [
        'property_id' => $property->id,
        'code' => 'FL-TEST-01',
        'name' => 'Test Floor',
        'sort_order' => 1
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Read
    getJson("/api/floors/{$id}")
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Test Floor']);

    // Update
    putJson("/api/floors/{$id}", ['name' => 'Updated Floor'])
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Floor']);

    // Delete
    deleteJson("/api/floors/{$id}")->assertStatus(200);

    // Trash
    getJson('/api/floors/trash')->assertStatus(200)->assertJsonFragment(['id' => $id]);
});

test('owner can crud floor within org', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);
    $property = Property::factory()->create(['org_id' => $org->id]);

    actingAs($owner);

    // Create
    $response = postJson('/api/floors', [
        'property_id' => $property->id,
        'code' => 'FL-OWNER-01',
        'name' => 'Owner Floor',
        'sort_order' => 1
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Update
    putJson("/api/floors/{$id}", ['name' => 'Owner Updated'])
        ->assertStatus(200);

    // Delete
    deleteJson("/api/floors/{$id}")->assertStatus(200);
});

test('owner cannot access other org floor', function () {
    $org1 = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org1->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $org2 = Org::factory()->create();
    $prop2 = Property::factory()->create(['org_id' => $org2->id]);
    $floor2 = Floor::factory()->create(['property_id' => $prop2->id, 'org_id' => $org2->id]);

    actingAs($owner)
        ->getJson("/api/floors/{$floor2->id}")
        ->assertStatus(403);
});
