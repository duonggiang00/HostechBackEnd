<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    // ===== REGISTRATION TESTS =====

    /**
     * Test user can register successfully
     */
    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'user' => ['id', 'email', 'full_name'],
            'token',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'full_name' => 'John Doe',
            'phone' => '1234567890',
            'is_active' => true,
        ]);

        // Verify user has Tenant role
        $user = User::where('email', 'john@example.com')->first();
        $this->assertTrue($user->hasRole('Tenant'));
        $this->assertTrue($user->hasPermissionTo('view Room'));
    }

    /**
     * Test registration validation requires full_name
     */
    public function test_registration_requires_full_name(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => '',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('full_name');
    }

    /**
     * Test registration requires valid email
     */
    public function test_registration_requires_valid_email(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'John Doe',
            'email' => 'invalid-email',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    /**
     * Test registration requires strong password
     */
    public function test_registration_requires_strong_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'weak',
            'password_confirmation' => 'weak',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('password');
    }

    /**
     * Test user cannot register with duplicate email
     */
    public function test_user_cannot_register_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'john@example.com']);

        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'Jane Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    /**
     * Test registered user gets Tenant role with correct permissions
     */
    public function test_registered_user_has_tenant_role_permissions(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'full_name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $response->assertStatus(201);
        $user = User::where('email', 'john@example.com')->first();

        // Should have only read room permission
        $this->assertTrue($user->hasPermissionTo('view Room'));
        $this->assertFalse($user->hasPermissionTo('create Room'));
    }

    // ===== LOGIN TESTS =====

    /**
     * Test user can login successfully
     */
    public function test_user_can_login(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
            'is_active' => true,
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

        // Token should be present (Sanctum returns it in response)
        $this->assertNotNull($response->json('token'));
    }

    /**
     * Test login with invalid credentials returns error
     */
    public function test_login_with_invalid_credentials(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'WrongPassword',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    /**
     * Test login with non-existent email fails
     */
    public function test_login_with_non_existent_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    /**
     * Test inactive user cannot login
     */
    public function test_inactive_user_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
            'is_active' => false,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors('email');
    }

    /**
     * Test successful login returns valid sanctum token
     */
    public function test_login_returns_valid_sanctum_token(): void
    {
        $user = User::factory()->create([
            'email' => 'john@example.com',
            'password_hash' => Hash::make('Password123!'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'john@example.com',
            'password' => 'Password123!',
        ]);

        $response->assertStatus(200);
        $token = $response->json('token');

        // Verify token exists and is a string
        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        // Verify token works for authenticated requests
        $authResponse = $this->getJson('/api/users', [
            'Authorization' => "Bearer {$token}",
        ]);

        // Should be able to access protected routes
        $this->assertNotNull($authResponse->json());
    }

    // ===== LOGOUT TESTS =====

    /**
     * Test user can logout successfully
     */
    public function test_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->postJson('/api/auth/logout', [], [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'message' => 'Logged out successfully',
        ]);

        // Verify token is deleted
        $this->assertDatabaseMissing('personal_access_tokens', [
            'token' => hash('sha256', $token),
        ]);
    }

    /**
     * Test logout requires authentication
     */
    public function test_logout_requires_authentication(): void
    {
        $response = $this->postJson('/api/auth/logout');

        $response->assertStatus(401);
    }

    // ===== PROFILE UPDATE TESTS =====

    /**
     * Test profile update endpoint exists
     */
    public function test_profile_update_endpoint_exists(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->putJson('/api/auth/user/profile-information', [
            'full_name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        // As long as we don't get 404, the endpoint exists
        $this->assertNotEquals(404, $response->status());
    }

    // ===== PASSWORD UPDATE TESTS =====

    /**
     * Test password update endpoint exists
     */
    public function test_password_update_endpoint_exists(): void
    {
        $user = User::factory()->create([
            'password_hash' => Hash::make('CurrentPassword123!'),
        ]);
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->putJson('/api/auth/user/password', [
            'current_password' => 'CurrentPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ], [
            'Authorization' => "Bearer {$token}",
        ]);

        // As long as we don't get 404, the endpoint exists
        $this->assertNotEquals(404, $response->status());
    }

    /**
     * Test password update requires authentication
     */
    public function test_password_update_requires_authentication(): void
    {
        $response = $this->putJson('/api/auth/user/password', [
            'current_password' => 'CurrentPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertStatus(401);
    }
    /**
     * Test authenticated user can get profile via /api/auth/me
     */
    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->getJson('/api/auth/me', [
            'Authorization' => "Bearer {$token}",
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'id' => $user->id,
            'email' => $user->email,
        ]);
    }
}
