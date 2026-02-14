<?php

use App\Models\User;
use App\Models\Org;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
});

test('system admin can view any org', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();

    actingAs($admin)
        ->getJson("/api/orgs/{$org->id}")
        ->assertStatus(200)
        ->assertJsonFragment(['id' => $org->id]);
});

test('system admin can update org', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();

    actingAs($admin)
        ->putJson("/api/orgs/{$org->id}", [
            'name' => 'Updated Org Name',
            'address' => 'Updated Address'
        ])
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Updated Org Name']);
});

test('system admin can delete org', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();

    actingAs($admin)
        ->deleteJson("/api/orgs/{$org->id}")
        ->assertStatus(200);

    $this->assertSoftDeleted($org);
});

test('system admin can restore org', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $org->delete();

    actingAs($admin)
        ->postJson("/api/orgs/{$org->id}/restore")
        ->assertStatus(200);

    $this->assertNotSoftDeleted($org);
});

test('owner can view own org', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    actingAs($owner)
        ->getJson("/api/orgs/{$org->id}")
        ->assertStatus(200);
});

test('owner cannot view other org', function () {
    $org1 = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org1->id]);
    $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $org2 = Org::factory()->create();

    actingAs($owner)
        ->getJson("/api/orgs/{$org2->id}")
        ->assertStatus(403);
});
