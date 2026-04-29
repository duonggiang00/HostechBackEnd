<?php

namespace Tests\Feature\Auth;

use App\Models\Org\Org;
use App\Models\Org\User;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Testing\TestResponse;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
        Artisan::call('rbac:sync');
    }

    /**
     * Test 2FA routes are available
     */
    public function test_two_factor_endpoints_are_accessible(): void
    {
        // This test checks that the custom MFA endpoints are registered and protected
        $response = $this->getJson('/api/user/mfa/setup');

        // Should return 401 (unauthenticated) because it requires Sanctum token
        $this->assertEquals(401, $response->status());
    }

    /**
     * Successful 2FA login must expose the same `user` JSON contract as password login (SPA / PermissionGate).
     */
    public function test_two_factor_login_response_matches_password_login_user_shape(): void
    {
        $user = User::factory()->create([
            'org_id' => Org::factory()->create()->id,
        ]);
        $user->assignRole('Owner');

        $this->actingAs($user, 'web');

        $response = app(TwoFactorLoginResponseContract::class)->toResponse(
            request()->merge([])
        );

        $wrapped = TestResponse::fromBaseResponse($response);
        $wrapped->assertJsonStructure([
            'user' => ['id', 'full_name', 'email', 'phone', 'org_id', 'role', 'roles', 'permissions'],
            'token',
        ]);
        $this->assertIsArray($wrapped->json('user.permissions'));
    }
}
