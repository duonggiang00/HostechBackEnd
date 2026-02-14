<?php

use App\Models\User;
use App\Models\Org;
use App\Models\Property;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
});

test('admin can crud property', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();

    actingAs($admin);

    // Create
    $response = postJson('/api/properties', [
        'org_id' => $org->id,
        'code' => 'PROP-TEST-01',
        'name' => 'Test Property',
        'status' => 'active',
        'type' => 'apartment'
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Read
    getJson("/api/properties/{$id}")
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Test Property']);

    // Update
    putJson("/api/properties/{$id}", ['name' => 'Updated Name'])
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Name']);

    // Delete
    deleteJson("/api/properties/{$id}")->assertStatus(200);

    // Trash
    getJson('/api/properties/trash')->assertStatus(200)->assertJsonFragment(['id' => $id]);
});

test('owner can crud property within org', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    actingAs($owner);

    // Create
    $response = postJson('/api/properties', [
        'code' => 'PROP-OWNER-01',
        'name' => 'Owner Property',
        'status' => 'active',
        'type' => 'office'
    ]);
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Update
    putJson("/api/properties/{$id}", ['name' => 'Owner Updated'])
        ->assertStatus(200);

    // Delete
    deleteJson("/api/properties/{$id}")->assertStatus(200);
});

test('owner cannot access other org property', function () {
    $org1 = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org1->id]);
    $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $org2 = Org::factory()->create();
    $prop2 = Property::factory()->create(['org_id' => $org2->id]);

    actingAs($owner)
        ->getJson("/api/properties/{$prop2->id}")
        ->assertStatus(403);
});
