<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TwoFactorAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
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
}
