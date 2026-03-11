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
        // This test checks that the 2FA endpoints are registered
        $response = $this->getJson('/api/auth/user/two-factor-secret-key');

        // Should return 401 (unauthenticated) not 404 (not found)
        $this->assertTrue(in_array($response->status(), [401, 403]));
    }
}
