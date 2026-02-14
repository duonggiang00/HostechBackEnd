<?php

use App\Models\Org;
use App\Models\User;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
});

test('admin can crud user', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();

    actingAs($admin);

    // Create
    $response = postJson('/api/users', [
        'org_id' => $org->id,
        'full_name' => 'Test User',
        'email' => 'testuser@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'role' => 'STAFF' // or Owner/Manager
        // Role assignment might differ based on controller implementation, 
        // usually passed as 'role' or 'roles' array if creating via User endpoint?
        // Let's assume basic user creation first.
    ]);
    
    // Check if UserStoreRequest allows password. 
    // If not, we might need to adjust or expects factory usage in controller?
    // Usually UserController allows creating "Staff/Manager".
    // For now, let's just assume standard fields.
    
    // Refine request: The controller likely uses UserStoreRequest.
    // Let's assume it accepts basic fields.
    
    if ($response->status() === 422) {
         // Debug validation errors if any
         // dump($response->json());
    }
    
    $response->assertStatus(201);
    $id = $response->json('data.id');

    // Read
    getJson("/api/users/{$id}")
        ->assertStatus(200)
        ->assertJsonFragment(['email' => 'testuser@example.com']);

    // Update
    putJson("/api/users/{$id}", ['full_name' => 'Updated Name'])
        ->assertStatus(200)
        ->assertJsonFragment(['full_name' => 'Updated Name']);

    // Delete
    deleteJson("/api/users/{$id}")->assertStatus(200);
    
    // Trash
    getJson('/api/users/trash')->assertStatus(200)->assertJsonFragment(['id' => $id]);
});

test('owner can view users in own org', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);
    
    $user2 = User::factory()->create(['org_id' => $org->id]);

    actingAs($owner)
        ->getJson("/api/users/{$user2->id}")
        ->assertStatus(200);
});

test('owner cannot view users in other org', function () {
    $org1 = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org1->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $org2 = Org::factory()->create();
    $user2 = User::factory()->create(['org_id' => $org2->id]);

    actingAs($owner)
        ->getJson("/api/users/{$user2->id}")
        ->assertStatus(403);
});
