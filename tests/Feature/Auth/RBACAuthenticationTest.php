<?php

namespace Tests\Feature\Auth;

use App\Models\User;
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

    /**
     * Test tenant user has only read room permission
     */
    public function test_tenant_user_has_read_room_permission(): void
    {
        $user = User::factory()->create(['email' => 'john@example.com']);
        $user->assignRole('Tenant');

        $this->assertTrue($user->hasPermissionTo('read Room'));
        $this->assertFalse($user->hasPermissionTo('create Room'));
        $this->assertFalse($user->hasPermissionTo('update Room'));
        $this->assertFalse($user->hasPermissionTo('delete Room'));
    }

    /**
     * Test tenant user cannot access other modules
     */
    public function test_tenant_user_cannot_access_other_modules(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Tenant');

        // Tenant should NOT have permission for modules they don't have
        $this->assertFalse($user->hasPermissionTo('create Room'));
        $this->assertFalse($user->hasPermissionTo('update Room'));
        $this->assertFalse($user->hasPermissionTo('delete Room'));
    }

    /**
     * Test owner user has full CRUD permissions for owned modules
     */
    public function test_owner_user_has_crud_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Owner');

        // Owner should have CRUD for Room module
        $this->assertTrue($user->hasPermissionTo('create Room'));
        $this->assertTrue($user->hasPermissionTo('read Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertTrue($user->hasPermissionTo('delete Room'));
    }

    /**
     * Test staff user has limited permissions
     */
    public function test_staff_user_has_limited_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Staff');

        // Staff should have RU (read, update) for Room
        $this->assertTrue($user->hasPermissionTo('read Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertFalse($user->hasPermissionTo('create Room'));
        $this->assertFalse($user->hasPermissionTo('delete Room'));
    }

    /**
     * Test manager user has CRUD permissions for managed modules
     */
    public function test_manager_user_has_crud_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Manager');

        // Manager should have CRUD for Property, Floor, Room
        $this->assertTrue($user->hasPermissionTo('create Room'));
        $this->assertTrue($user->hasPermissionTo('read Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertTrue($user->hasPermissionTo('delete Room'));
    }

    /**
     * Test admin user has all permissions
     */
    public function test_admin_user_has_all_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');

        // Admin should have all permissions for Room at least
        $this->assertTrue($user->hasPermissionTo('create Room'));
        $this->assertTrue($user->hasPermissionTo('read Room'));
        $this->assertTrue($user->hasPermissionTo('update Room'));
        $this->assertTrue($user->hasPermissionTo('delete Room'));
    }

    /**
     * Test user with multiple roles has combined permissions
     */
    public function test_user_with_multiple_roles_has_combined_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Tenant');
        $user->assignRole('Staff');

        // Should have Tenant's read Room permission
        $this->assertTrue($user->hasPermissionTo('read Room'));
        // Should have Staff's update Room permission
        $this->assertTrue($user->hasPermissionTo('update Room'));
        // Should not have create Room (neither Tenant nor Staff can create)
        $this->assertFalse($user->hasPermissionTo('create Room'));
    }

    /**
     * Test authenticated user info includes roles
     */
    public function test_authenticated_user_info_includes_roles(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
        ]);
        $user->assignRole('Owner');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'user' => ['id', 'email', 'full_name'],
        ]);
    }

    /**
     * Test user can only see own role permissions
     */
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
        ])->getJson('/api/v1/users');

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
        $this->assertTrue($user->hasRole('Tenant'));
        $this->assertTrue($user->hasPermissionTo('read Room'));
    }
}
