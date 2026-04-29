<?php

namespace Tests\Feature;

use App\Models\Org\Org;
use App\Models\Org\User;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * End-to-end smoke aligned with DEPLOY.md (health, login, finance read).
 * Filter in CI: php artisan test --filter=SyntheticSmoke
 */
class SyntheticSmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
        Artisan::call('rbac:sync');
    }

    public function test_health_login_and_finance_read(): void
    {
        $this->get('/up')->assertOk();

        $org = Org::factory()->create();

        $owner = User::factory()->create([
            'org_id' => $org->id,
            'email' => 'synthetic-owner@example.test',
            'password_hash' => Hash::make('Password123!'),
            'is_active' => true,
        ]);
        $owner->assignRole('Owner');

        $login = $this->postJson('/api/auth/login', [
            'email' => 'synthetic-owner@example.test',
            'password' => 'Password123!',
        ]);
        $login->assertOk();
        $login->assertJsonStructure(['user' => ['id', 'permissions'], 'token']);
        $token = $login->json('token');
        $this->assertIsString($token);

        $this->getJson('/api/auth/me', [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk();

        $this->getJson('/api/finance/payments', [
            'Authorization' => 'Bearer '.$token,
        ])->assertOk();
    }
}
