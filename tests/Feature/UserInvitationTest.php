<?php

namespace Tests\Feature;

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\System\UserInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
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
            'role_name' => 'Owner'
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
            'role_name' => 'Tenant'
        ]);

        $response->assertStatus(201)
                 ->assertJsonPath('data.org_id', $owner->org_id);
    }

    public function test_owner_cannot_invite_admin()
    {
        $owner = $this->createOwner();

        $response = $this->actingAs($owner)->postJson('/api/invitations', [
            'email' => 'admin2@example.com',
            'role_name' => 'Admin'
        ]);

        $response->assertStatus(422); // Validation block since Admin is not in allowed roles
    }

    public function test_token_validation()
    {
        $admin = $this->createAdmin();
        $response = $this->actingAs($admin)->postJson('/api/invitations', [
            'email' => 'validate@example.com',
            'role_name' => 'Owner'
        ]);
        
        $token = $response->json('data.token');

        // Validation is public
        $validResponse = $this->getJson('/api/invitations/validate/' . $token);
        
        $validResponse->assertStatus(200)
                      ->assertJsonPath('data.email', 'validate@example.com')
                      ->assertJsonPath('data.requires_org_creation', true);
    }

    public function test_user_can_register_via_invite()
    {
        $this->withoutExceptionHandling();
        $admin = $this->createAdmin();
        
        // Generate via Service to keep the HTTP session as a Guest
        $service = app(\App\Services\System\UserInvitationService::class);
        $invitation = $service->createInvite($admin, [
            'email' => 'registerowner@example.com',
            'role_name' => 'Owner',
            'properties_scope' => []
        ]);
        
        $token = $invitation->token;

        // Register via Fortify
        $registerResponse = $this->postJson('/api/auth/register', [
            'full_name' => 'New Owner Name',
            'email' => 'registerowner@example.com',
            'password' => 'Vq!2f#1224d$f',
            'password_confirmation' => 'Vq!2f#1224d$f',
            'invite_token' => $token,
            'org_name' => 'Brand New Organization'
        ]);

        $this->assertDatabaseHas('orgs', [
            'name' => 'Brand New Organization'
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
            'code' => 'MGR01'
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
            'properties_scope' => [$property->id]
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('user_invitations', [
            'email' => 'tenant1@manager.com',
            'invited_by' => $manager->id
        ]);
    }

    public function test_manager_cannot_invite_tenant_to_unassigned_property()
    {
        [$manager, $property] = $this->createManagerWithProperty();
        
        // Create another property not assigned to manager
        $otherProperty = Property::create([
            'org_id' => $manager->org_id,
            'name' => 'Other Property',
            'code' => 'OTH01'
        ]);

        $response = $this->actingAs($manager)->postJson('/api/invitations', [
            'email' => 'tenant2@manager.com',
            'role_name' => 'Tenant',
            'properties_scope' => [$otherProperty->id]
        ]);

        $response->assertStatus(400)
                 ->assertJsonPath('message', 'You can only invite users to properties you manage.');
    }

    public function test_owner_is_automatically_restricted_to_their_org()
    {
        $owner = $this->createOwner();

        $response = $this->actingAs($owner)->postJson('/api/invitations', [
            'email' => 'staff1@owner.com',
            'role_name' => 'Staff'
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
            'code' => 'OTH01'
        ]);

        $response = $this->actingAs($manager)->postJson('/api/invitations', [
            'email' => 'staff2@manager.com',
            'role_name' => 'Staff',
            'properties_scope' => [$otherProperty->id]
        ]);

        $response->assertStatus(400)
                 ->assertJsonPath('message', 'You can only invite users to properties you manage.');
    }
}
