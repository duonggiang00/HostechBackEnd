<?php

namespace Tests\Feature;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\System\UserInvitation;
use App\Services\System\UserInvitationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserInvitationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Roles
        $roles = ['Admin', 'Owner', 'Manager', 'Staff', 'Tenant'];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        Artisan::call('rbac:sync');
    }

    private function createAdmin(): User
    {
        $org = Org::create(['name' => 'System Org']);
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        return $admin;
    }

    private function createOwner(): User
    {
        $org = Org::create(['name' => 'Test Org']);
        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        return $owner;
    }

    public function test_admin_can_invite_owner()
    {
        $admin = $this->createAdmin();

        $response = $this->actingAs($admin)->postJson('/api/invitations', [
            'email' => 'newowner@example.com',
            'role_name' => 'Owner',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.role_name', 'Owner')
            ->assertJsonPath('data.org_id', null);

        $this->assertDatabaseHas('user_invitations', [
            'email' => 'newowner@example.com',
            'role_name' => 'Owner',
            'org_id' => null,
        ]);
    }

    public function test_owner_can_invite_tenant()
    {
        $owner = $this->createOwner();

        $response = $this->actingAs($owner)->postJson('/api/invitations', [
            'email' => 'tenant@example.com',
            'role_name' => 'Tenant',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.org_id', $owner->org_id);
    }

    public function test_owner_cannot_invite_admin()
    {
        $owner = $this->createOwner();

        $response = $this->actingAs($owner)->postJson('/api/invitations', [
            'email' => 'admin2@example.com',
            'role_name' => 'Admin',
        ]);

        $response->assertStatus(422); // Validation block since Admin is not in allowed roles
    }

    public function test_token_validation()
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->postJson('/api/invitations', [
            'email' => 'validate@example.com',
            'role_name' => 'Owner',
        ]);

        $token = $response->json('data.token');

        // Validation is public
        $validResponse = $this->getJson('/api/system/invitations/validate/'.$token);

        $validResponse->assertStatus(200)
            ->assertJsonPath('data.email', 'validate@example.com')
            ->assertJsonPath('data.requires_org_creation', true);
    }

    public function test_user_can_register_via_invite()
    {
        $this->withoutExceptionHandling();
        $admin = $this->createAdmin();

        // Generate via Service to keep the HTTP session as a Guest
        $service = app(UserInvitationService::class);
        $invitation = $service->createInvite($admin, [
            'email' => 'registerowner@example.com',
            'role_name' => 'Owner',
            'properties_scope' => [],
        ]);

        $token = $invitation->token;

        // Register via Fortify
        $registerResponse = $this->postJson('/api/auth/register', [
            'full_name' => 'New Owner Name',
            'email' => 'registerowner@example.com',
            'password' => 'Vq!2f#1224d$f',
            'password_confirmation' => 'Vq!2f#1224d$f',
            'invite_token' => $token,
            'org_name' => 'Brand New Organization',
        ]);

        $this->assertDatabaseHas('orgs', [
            'name' => 'Brand New Organization',
        ]);

        $user = User::where('email', 'registerowner@example.com')->first();
        $this->assertNotNull($user);
        $this->assertTrue($user->hasRole('Owner'));

        // Ensure invitation is marked as used
        $this->assertDatabaseHas('user_invitations', [
            'email' => 'registerowner@example.com',
        ]);
        $invitation = UserInvitation::where('email', 'registerowner@example.com')->first();
        $this->assertNotNull($invitation->registered_at);
    }

    private function createManagerWithProperty(): array
    {
        $org = Org::create(['name' => 'Manager Org']);
        $manager = User::factory()->create(['org_id' => $org->id]);
        $manager->assignRole('Manager');

        $property = Property::create([
            'org_id' => $org->id,
            'name' => 'Manager Property',
            'code' => 'MGR01',
        ]);

        $manager->properties()->attach($property->id);

        return [$manager, $property];
    }

    public function test_manager_can_invite_tenant_to_their_property()
    {
        [$manager, $property] = $this->createManagerWithProperty();

        $response = $this->actingAs($manager)->postJson('/api/invitations', [
            'email' => 'tenant1@manager.com',
            'role_name' => 'Tenant',
            'properties_scope' => [$property->id],
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('user_invitations', [
            'email' => 'tenant1@manager.com',
            'invited_by' => $manager->id,
        ]);
    }

    public function test_manager_cannot_invite_tenant_to_unassigned_property()
    {
        [$manager, $property] = $this->createManagerWithProperty();

        // Create another property not assigned to manager
        $otherProperty = Property::create([
            'org_id' => $manager->org_id,
            'name' => 'Other Property',
            'code' => 'OTH01',
        ]);

        $response = $this->actingAs($manager)->postJson('/api/invitations', [
            'email' => 'tenant2@manager.com',
            'role_name' => 'Tenant',
            'properties_scope' => [$otherProperty->id],
        ]);

        $response->assertStatus(400);
    }

    public function test_owner_is_automatically_restricted_to_their_org()
    {
        $owner = $this->createOwner();

        $response = $this->actingAs($owner)->postJson('/api/invitations', [
            'email' => 'staff1@owner.com',
            'role_name' => 'Staff',
            // Deliberately trying to pass another org_id should be ignored/overridden by service
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.org_id', $owner->org_id);
    }

    public function test_manager_cannot_invite_staff_to_unassigned_property()
    {
        [$manager, $property] = $this->createManagerWithProperty();

        // Create another property not assigned to manager
        $otherProperty = Property::create([
            'org_id' => $manager->org_id,
            'name' => 'Other Property',
            'code' => 'OTH01',
        ]);

        $response = $this->actingAs($manager)->postJson('/api/invitations', [
            'email' => 'staff2@manager.com',
            'role_name' => 'Staff',
            'properties_scope' => [$otherProperty->id],
        ]);

        $response->assertStatus(400);
    }

    // ─── Prefill tests ───────────────────────────────────────────────────────

    /** Helper: spin up a contract + PENDING_INVITE member for a given email. */
    private function createPendingInviteMember(string $email, string $orgId, array $overrides = []): ContractMember
    {
        $property = Property::create(['org_id' => $orgId, 'name' => 'Test Prop', 'code' => 'TP01']);
        $room = Room::create(['org_id' => $orgId, 'property_id' => $property->id, 'name' => 'R01', 'code' => 'R01']);
        $contract = Contract::create([
            'org_id' => $orgId,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => 'PENDING_SIGNATURE',
            'start_date' => now()->toDateString(),
            'rent_price' => 5000000,
        ]);

        return ContractMember::create(array_merge([
            'org_id' => $orgId,
            'contract_id' => $contract->id,
            'email' => $email,
            'full_name' => 'Nguyễn Văn A',
            'phone' => '0901234567',
            'identity_number' => '012345678901',
            'date_of_birth' => '1995-06-15',
            'license_plate' => '51G-12345',
            'permanent_address' => '123 Đường Láng, Hà Nội',
            'role' => 'TENANT',
            'status' => 'PENDING_INVITE',
            'is_primary' => true,
        ], $overrides));
    }

    public function test_validate_token_returns_prefill_for_tenant_invite(): void
    {
        $org = Org::create(['name' => 'Prefill Org']);
        $manager = User::factory()->create(['org_id' => $org->id]);
        $manager->assignRole('Manager');

        $email = 'prefill_tenant@example.com';
        $this->createPendingInviteMember($email, $org->id);

        // Create invitation manually (bypasses mail queue)
        $invitation = UserInvitation::create([
            'email' => $email,
            'token' => 'test-prefill-token-1234',
            'role_name' => 'Tenant',
            'org_id' => $org->id,
            'invited_by' => $manager->id,
            'expires_at' => now()->addDays(3),
        ]);

        $response = $this->getJson('/api/system/invitations/validate/' . $invitation->token);

        $response->assertStatus(200)
            ->assertJsonPath('data.email', $email)
            ->assertJsonPath('data.contract_member_prefill.full_name', 'Nguyễn Văn A')
            ->assertJsonPath('data.contract_member_prefill.phone', '0901234567')
            ->assertJsonPath('data.contract_member_prefill.identity_number', '012345678901')
            ->assertJsonPath('data.contract_member_prefill.date_of_birth', '1995-06-15')
            ->assertJsonPath('data.contract_member_prefill.license_plate', '51G-12345')
            ->assertJsonPath('data.contract_member_prefill.address', '123 Đường Láng, Hà Nội')
            ->assertJsonPath('data.contract_member_prefill.has_identity_documents', false);
    }

    public function test_validate_token_no_prefill_when_no_pending_invite_member(): void
    {
        $admin = $this->createAdmin();

        $invitation = UserInvitation::create([
            'email' => 'no_member@example.com',
            'token' => 'test-no-member-token-5678',
            'role_name' => 'Tenant',
            'org_id' => $admin->org_id,
            'invited_by' => $admin->id,
            'expires_at' => now()->addDays(3),
        ]);

        $response = $this->getJson('/api/system/invitations/validate/' . $invitation->token);

        $response->assertStatus(200)
            ->assertJsonPath('data.contract_member_prefill', null);
    }

    public function test_register_from_invite_merges_snapshot_when_form_empty(): void
    {
        \Illuminate\Support\Facades\Storage::fake('local');

        $org = Org::create(['name' => 'Merge Org']);
        $manager = User::factory()->create(['org_id' => $org->id]);
        $manager->assignRole('Manager');

        $email = 'merge_test@example.com';
        $this->createPendingInviteMember($email, $org->id, [
            'full_name' => 'Bản ghi hợp đồng',
            'phone' => '0999000111',
            'identity_number' => '098765432100',
            'date_of_birth' => '1992-03-20',
        ]);

        $invitation = UserInvitation::create([
            'email' => $email,
            'token' => 'test-merge-token-abcd',
            'role_name' => 'Tenant',
            'org_id' => $org->id,
            'invited_by' => $manager->id,
            'expires_at' => now()->addDays(3),
        ]);

        // Register without phone / identity_number — should be filled from snapshot
        $this->postJson('/api/auth/register', [
            'full_name' => 'Bản ghi hợp đồng',
            'email' => $email,
            'password' => 'Vq!2f#1224d$f',
            'password_confirmation' => 'Vq!2f#1224d$f',
            'invite_token' => $invitation->token,
        ])->assertSuccessful();

        $user = User::where('email', $email)->first();
        $this->assertNotNull($user);
        $this->assertEquals('0999000111', $user->phone);
        $this->assertEquals('098765432100', $user->identity_number);
        // date_of_birth is stored as a plain string in the users table (no date cast)
        $this->assertEquals('1992-03-20', substr((string) $user->date_of_birth, 0, 10));
    }
}
