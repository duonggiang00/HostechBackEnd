<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Kiểm tra: request không có token / hết hạn → API trả 401.
 * Frontend Axios interceptor bắt 401 → gọi logout() + redirect /login.
 * ProtectedRoute bắt isAuthenticated=false → <Navigate to="/login" />.
 */
class UnauthenticatedRedirectTest extends TestCase
{
    use RefreshDatabase;

    /** Danh sách các protected endpoint tiêu biểu. */
    private function protectedRoutes(): array
    {
        return [
            ['GET',  '/api/auth/me'],
            ['GET',  '/api/profile'],
            ['GET',  '/api/properties'],
            ['GET',  '/api/rooms'],
            ['GET',  '/api/contracts'],
            ['GET',  '/api/invoices'],
            ['GET',  '/api/handovers'],
            ['GET',  '/api/finance/ledger/summary'],
            ['GET',  '/api/finance/cashflow-feed'],
            ['GET',  '/api/meter-readings'],
            ['GET',  '/api/tickets'],
            ['GET',  '/api/users'],
        ];
    }

    // ── 1. Không có token gì cả ──────────────────────────────────

    public function test_all_protected_api_routes_return_401_when_no_token(): void
    {
        foreach ($this->protectedRoutes() as [$method, $path]) {
            $response = $this->json($method, $path);

            $response->assertStatus(401, "Route [{$method} {$path}] phải trả 401 khi không có token.");
        }
    }

    public function test_401_response_has_correct_message_format(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
        $response->assertJsonStructure(['message']);
        $this->assertNotEmpty($response->json('message'));
    }

    // ── 2. Token sai / giả mạo ───────────────────────────────────

    public function test_fake_bearer_token_returns_401(): void
    {
        $response = $this->withToken('this-is-a-fake-token-abc123')
            ->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_malformed_authorization_header_returns_401(): void
    {
        $response = $this->withHeaders(['Authorization' => 'NotBearer something'])
            ->getJson('/api/properties');

        $response->assertStatus(401);
    }

    // ── 3. POST / PATCH / DELETE cũng phải được bảo vệ ──────────

    public function test_unauthenticated_post_returns_401(): void
    {
        $this->postJson('/api/rooms', ['name' => 'Test'])->assertStatus(401);
        $this->postJson('/api/contracts', [])->assertStatus(401);
        $this->postJson('/api/invoices', [])->assertStatus(401);
    }

    public function test_unauthenticated_delete_returns_401(): void
    {
        $fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
        $this->deleteJson("/api/rooms/{$fakeId}")->assertStatus(401);
    }

    // ── 4. SPA public routes KHÔNG yêu cầu auth ─────────────────

    public function test_login_endpoint_is_publicly_accessible(): void
    {
        // POST /api/auth/login phải không trả 401 (dù có thể trả 422/invalid)
        $response = $this->postJson('/api/auth/login', [
            'identifier' => '',
            'password' => '',
        ]);

        $this->assertNotEquals(401, $response->status(), '/api/auth/login không được yêu cầu auth.');
    }

    // ── 5. Storage public files KHÔNG yêu cầu auth ───────────────

    public function test_storage_url_is_publicly_accessible(): void
    {
        // /storage/* phục vụ file tĩnh — không cần auth
        $response = $this->get('/storage/does-not-exist.png');

        // 404 là chấp nhận được (file không tồn tại), nhưng KHÔNG phải 401
        $this->assertNotEquals(401, $response->status(), '/storage/ không được chặn bởi auth.');
    }
}
