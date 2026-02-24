<?php

namespace Tests\Feature\Rbac;

use App\Models\Org\Org;
use App\Models\Org\User;
use Spatie\Permission\Models\Role;
use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;

class UserCreationScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    public function test_owner_cannot_create_user_for_other_org()
    {
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');

        $org2 = Org::factory()->create();

        // Try to create user for Org 2
        $response = $this->actingAs($owner)->postJson('/api/users', [
            'org_id' => $org2->id, // Maliciously targeting other org
            'full_name' => 'Intruder',
            'email' => 'intruder@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'STAFF'
        ]);

        // Should return 403 Forbidden or 422 with validation error
        // Currently expecting this to FAIL (i.e., return 201) because logic is missing.
        $response->assertStatus(403); 
    }

    public function test_owner_cannot_create_admin_user()
    {
        $org = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->postJson('/api/users', [
            'org_id' => $org->id,
            'full_name' => 'Fake Admin',
            'email' => 'fakeadmin@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'ADMIN' // Maliciously trying to create Admin
        ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_create_staff_in_own_org()
    {
        $org = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->postJson('/api/users', [
            'org_id' => $org->id,
            'full_name' => 'Legit Staff',
            'email' => 'staff@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'role' => 'STAFF'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'staff@example.com', 'org_id' => $org->id]);
    }

    public function test_owner_cannot_escalate_role_via_update()
    {
        $org = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');
        
        $staff = User::factory()->create(['org_id' => $org->id]);
        $staff->assignRole('Staff'); // Staff in same org

        // Ty to upgrade Staff to Admin
        $response = $this->actingAs($owner)->putJson("/api/users/{$staff->id}", [
            'role' => 'ADMIN'
        ]);

        $response->assertStatus(403);
    }
}
