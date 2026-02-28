<?php

namespace Tests\Feature;

use App\Models\Org\Org;
use App\Models\Org\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        Role::firstOrCreate(['name' => 'Tenant', 'guard_name' => 'web']);
    }

    private function createUser(array $attrs = []): User
    {
        $org = Org::create(['name' => 'Test Org']);
        $user = User::factory()->create(array_merge([
            'org_id'       => $org->id,
            'full_name'    => 'Nguyen Van A',
            'password'     => 'Password123!',
        ], $attrs));
        $user->assignRole('Tenant');
        return $user;
    }

    // ─── GET /api/profile ────────────────────────────────────────────────────

    public function test_authenticated_user_can_get_their_profile()
    {
        $user = $this->createUser();
        $response = $this->actingAs($user)->getJson('/api/profile');

        $response->assertStatus(200)
                 ->assertJsonPath('data.id', (string) $user->id)
                 ->assertJsonPath('data.full_name', $user->full_name)
                 ->assertJsonPath('data.email', $user->email)
                 ->assertJsonMissingPath('data.password_hash')
                 ->assertJsonMissingPath('data.two_factor_secret')
                 ->assertJsonMissingPath('data.mfa_secret_encrypted')
                 ->assertJsonStructure(['data' => ['id', 'full_name', 'email', 'roles', 'mfa_enabled', 'two_factor_enabled', 'avatar_url']]);
    }

    public function test_auth_me_returns_user_resource_without_sensitive_fields()
    {
        $user = $this->createUser();
        $response = $this->actingAs($user)->getJson('/api/auth/me');

        $response->assertStatus(200)
                 ->assertJsonMissingPath('data.password_hash')
                 ->assertJsonMissingPath('data.two_factor_secret')
                 ->assertJsonStructure(['data' => ['id', 'full_name', 'email', 'two_factor_enabled']]);
    }

    // ─── PUT /api/profile ────────────────────────────────────────────────────

    public function test_user_can_update_profile_with_identity_fields()
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->putJson('/api/profile', [
            'full_name'             => 'Nguyen Van B',
            'email'                 => $user->email,
            'phone'                 => '0901234567',
            'identity_number'       => '001234567890',
            'identity_issued_date'  => '2020-01-15',
            'identity_issued_place' => 'Cục Cảnh sát ĐKQL cư trú',
            'date_of_birth'         => '1995-06-20',
            'address'               => '123 Đường ABC, Quận 1, TP.HCM',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('data.full_name', 'Nguyen Van B')
                 ->assertJsonPath('data.identity_number', '001234567890')
                 ->assertJsonPath('data.date_of_birth', '1995-06-20')
                 ->assertJsonPath('data.address', '123 Đường ABC, Quận 1, TP.HCM');

        $this->assertDatabaseHas('users', [
            'id'               => $user->id,
            'full_name'        => 'Nguyen Van B',
            'identity_number'  => '001234567890',
        ]);
    }

    public function test_update_profile_rejects_duplicate_email()
    {
        $user1 = $this->createUser(['email' => 'user1@example.com']);
        $user2 = $this->createUser(['email' => 'user2@example.com']);

        $response = $this->actingAs($user1)->putJson('/api/profile', [
            'full_name' => 'User 1',
            'email'     => 'user2@example.com', // Already taken
        ]);

        $response->assertStatus(422);
    }

    // ─── POST /api/profile/change-password ──────────────────────────────────

    public function test_user_can_change_password_with_correct_current_password()
    {
        $user = $this->createUser(['password' => 'OldPassword1!']);

        $response = $this->actingAs($user)->postJson('/api/profile/change-password', [
            'current_password'      => 'OldPassword1!',
            'password'              => 'NewPassword2!',
            'password_confirmation' => 'NewPassword2!',
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'Đổi mật khẩu thành công.');

        $this->assertTrue(Hash::check('NewPassword2!', $user->fresh()->getAuthPassword()));
    }

    public function test_change_password_fails_with_wrong_current_password()
    {
        $user = $this->createUser(['password' => 'OldPassword1!']);

        $response = $this->actingAs($user)->postJson('/api/profile/change-password', [
            'current_password'      => 'WrongPassword!',
            'password'              => 'NewPassword2!',
            'password_confirmation' => 'NewPassword2!',
        ]);

        $response->assertStatus(422);
    }

    // ─── POST /api/profile/avatar ────────────────────────────────────────────

    public function test_user_can_upload_avatar()
    {
        $user = $this->createUser();
        $file = UploadedFile::fake()->image('avatar.jpg', 400, 400);

        $response = $this->actingAs($user)->postJson('/api/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('message', 'Cập nhật ảnh đại diện thành công.')
                 ->assertJsonStructure(['message', 'avatar_url']);
    }

    public function test_avatar_upload_rejects_non_image_file()
    {
        $user = $this->createUser();
        $file = UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf');

        $response = $this->actingAs($user)->postJson('/api/profile/avatar', [
            'avatar' => $file,
        ]);

        $response->assertStatus(422);
    }

    // ─── GET /api/profile/mfa-status ────────────────────────────────────────

    public function test_user_can_get_mfa_status()
    {
        $user = $this->createUser();

        $response = $this->actingAs($user)->getJson('/api/profile/mfa-status');

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'mfa_enabled', 'mfa_method', 'mfa_enrolled_at',
                     'two_factor_enabled', 'two_factor_confirmed_at',
                 ])
                 ->assertJsonPath('mfa_enabled', false)
                 ->assertJsonPath('two_factor_enabled', false);
    }
}
