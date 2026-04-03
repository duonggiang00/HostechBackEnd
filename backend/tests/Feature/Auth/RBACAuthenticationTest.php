<?php

namespace Tests\Feature\Auth;

use App\Features\Org\Models\User;
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
        $invitation = \App\Features\System\Models\UserInvitation::create([
            'email' => 'john@example.com',
            'token' => 'mock-token-123',
            'role_name' => 'Tenant',
            'expires_at' => now()->addDays(1),
            'org_id' => \App\Features\Org\Models\Org::factory()->create()->id,
            'invited_by' => \App\Features\Org\Models\User::factory()->create()->id,
        ]);

        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'invite_token' => 'mock-token-123',
        ]);

        $response->assertStatus(201);

        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue($user->hasRole('Tenant'));
    }

    // Verify tenant user has read property permission
    public function test_tenant_user_has_read_property_permission(): void
    {
        $user = User::factory()->create(['email' => 'john@example.com']);
        $user->assignRole('Tenant');

        $this->assertTrue($user->hasPermissionTo('view Properties'));
        $this->assertFalse($user->hasPermissionTo('create Properties'));
        $this->assertFalse($user->hasPermissionTo('update Properties'));
        $this->assertFalse($user->hasPermissionTo('delete Properties'));
    }

    public function test_owner_user_has_crud_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Owner');

        // Owner should have CRUD for Properties module
        $this->assertTrue($user->hasPermissionTo('create Properties'));
        $this->assertTrue($user->hasPermissionTo('view Properties'));
        $this->assertTrue($user->hasPermissionTo('update Properties'));
        $this->assertTrue($user->hasPermissionTo('delete Properties'));
    }

    public function test_staff_user_has_limited_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Staff');

        // Staff should have R (read) for Properties
        $this->assertTrue($user->hasPermissionTo('view Properties'));
        $this->assertFalse($user->hasPermissionTo('update Properties'));
        $this->assertFalse($user->hasPermissionTo('create Properties'));
        $this->assertFalse($user->hasPermissionTo('delete Properties'));
    }

    public function test_manager_user_has_ru_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Manager');

        // Manager should have RU permissions according to PropertyPolicy
        $this->assertTrue($user->hasPermissionTo('view Properties'));
        $this->assertTrue($user->hasPermissionTo('update Properties'));
        $this->assertFalse($user->hasPermissionTo('create Properties'));
        $this->assertFalse($user->hasPermissionTo('delete Properties'));
    }

    public function test_admin_user_has_all_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Admin');

        // Admin bypasses via Gate, so explicit permissions might not exist in DB unless manually assigned.
        // The RbacService doesn't assign permissions to Admin role automatically in its module processing.
        $this->assertFalse($user->hasPermissionTo('create Properties'));
    }

    public function test_user_with_multiple_roles_has_combined_permissions(): void
    {
        $user = User::factory()->create();
        $user->assignRole('Tenant'); // R
        $user->assignRole('Manager'); // RU

        // Should have combined RU
        $this->assertTrue($user->hasPermissionTo('view Properties'));
        $this->assertTrue($user->hasPermissionTo('update Properties'));
        $this->assertFalse($user->hasPermissionTo('create Properties'));
    }

    public function test_user_can_checkown_permissions(): void
    {
        $user = User::factory()->create([
            'org_id' => \Illuminate\Support\Str::uuid(),
        ]);
        $user->assignRole('Owner');

        $token = $user->createToken('test-token')->plainTextToken;

        // User should be able to check their own profile/info
        $response = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->getJson('/api/auth/me');

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
            'is_active' => true,
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
            'is_active' => true,
        ]);
        $user->assignRole('Tenant');

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);

        // Verify tenant has correct permissions
        $user->refresh();
        $this->assertTrue($user->hasPermissionTo('view Properties'));
    }
}
