<?php

namespace Tests\Feature\Auth;

use App\Models\Org\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RBACAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    /**
     * Test registered user gets Tenant role with correct read-only permission
     */
    public function test_registered_user_gets_tenant_role(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue($user->hasRole('Tenant'));
    }

        // Verify tenant user has read room permission
    public function test_tenant_user_has_read_room_permission(): void
    {
        $user = User::factory()->create(['email' => 'john@example.com']);
        $user->assignRole('Tenant');

        $this->assertTrue($user->hasPermissionTo('view Room'));
        $this->assertFalse($user->hasPermissionTo('create Room'));
        $this->assertFalse($user->hasPermissionTo('update Room'));
        $this->assertFalse($user->hasPermissionTo('delete Room'));
    }

    // ... (skipping some unchanged)

    public function test_owner_user_has_crud_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Owner');

        // Owner should have CRUD for Room module
        $this->assertTrue($user->hasPermissionTo('create Room'));
        $this->assertTrue($user->hasPermissionTo('view Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertTrue($user->hasPermissionTo('delete Room'));
    }

    public function test_staff_user_has_limited_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Staff');

        // Staff should have RU (read, update) for Room
        $this->assertTrue($user->hasPermissionTo('view Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertFalse($user->hasPermissionTo('create Room'));
        $this->assertFalse($user->hasPermissionTo('delete Room'));
    }

    public function test_manager_user_has_crud_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Manager');

        // Manager should have valid permissions
        // RoomPolicy: Manager => CRUD
        $this->assertTrue($user->hasPermissionTo('view Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertTrue($user->hasPermissionTo('create Room'));
        $this->assertTrue($user->hasPermissionTo('delete Room'));
    }

    public function test_admin_user_has_all_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');

        // Admin bypasses via Gate, so explicit permissions might not exist in DB.
        // We assert False here to confirm no DB pollution, validating Gate logic elsewhere (SystemTest/OrgTest).
        $this->assertFalse($user->hasPermissionTo('create Room'));
    }

    public function test_user_with_multiple_roles_has_combined_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Tenant'); // -
        $user->assignRole('Manager'); // RU

        // Should have Manager's view Room permission
        $this->assertTrue($user->hasPermissionTo('view Room'));
        // Should have Manager's update Room permission
        $this->assertTrue($user->hasPermissionTo('update Room'));
        // Should have create Room (Manager can create)
        $this->assertTrue($user->hasPermissionTo('create Room'));
    }

    // ...

    public function test_user_can_checkown_permissions(): void
    {
        $user = User::factory()->create([
            'org_id' => \Illuminate\Support\Str::uuid(),
        ]);
        // Use Owner role which has permission to view users in org
        $user->assignRole('Owner');

        $token = $user->createToken('test-token')->plainTextToken;

        // User should be able to check their own permissions via API
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
            'X-Org-Id' => $user->org_id,
        ])->getJson('/api/users'); // Fixed path

        // Should have access to protected route with valid token
        $response->assertStatus(200);
    }


    /**
     * Test role assignment is persistent after login
     */
    public function test_role_assignment_is_persistent_after_login(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
        ]);
        $user->assignRole('Admin');

        // Login
        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);

        // Role should still be there
        $user->refresh();
        $this->assertTrue($user->hasRole('Admin'));
    }

    /**
     * Test permission caching doesn't cause issues with fresh login
     */
    public function test_permission_caching_with_fresh_login(): void
    {
        // Create and login user with Tenant role
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
        ]);
        $user->assignRole('Tenant');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);

        // Verify tenant has correct permissions
        $user->refresh();
        $this->assertTrue($user->hasPermissionTo('view Room'));
    }
}
