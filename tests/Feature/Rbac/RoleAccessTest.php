<?php

namespace Tests\Feature\Rbac;

use App\Models\Org;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected $org;
    protected $owner;
    protected $manager;
    protected $staff;
    protected $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        // Run seeders to setup Roles and Permissions
        $this->seed(\Database\Seeders\RbacSeeder::class);

        // Create Org
        $this->org = Org::factory()->create();

        // Create Users with Roles
        $this->owner = $this->createUserWithRole('Owner');
        $this->manager = $this->createUserWithRole('Manager');
        $this->staff = $this->createUserWithRole('Staff');
        $this->tenant = $this->createUserWithRole('Tenant');
    }

    protected function createUserWithRole(string $roleName): User
    {
        $user = User::factory()->create(['org_id' => $this->org->id]);
        $user->assignRole($roleName);
        return $user;
    }

    /**
     * Test Property Module Access
     */
    public function test_owner_can_create_property()
    {
        $response = $this->actingAs($this->owner)->postJson('/api/properties', [
            'name' => 'Test Property',
            'code' => 'TEST-001',
            'org_id' => $this->org->id
        ]);

        $response->assertCreated();
    }

    public function test_manager_cannot_create_property()
    {
        // Manager has 'RU' (Read, Update), not Create
        $response = $this->actingAs($this->manager)->postJson('/api/properties', [
            'name' => 'Manager Property',
            'code' => 'MGR-001',
            'org_id' => $this->org->id
        ]);

        $response->assertForbidden();
    }

    public function test_staff_can_view_property()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->staff)->getJson("/api/properties/{$property->id}");

        $response->assertOk();
    }

    public function test_staff_cannot_update_property()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);
        
        // Debug
        // dump($this->staff->getAllPermissions()->pluck('name')->toArray());

        $response = $this->actingAs($this->staff)->putJson("/api/properties/{$property->id}", [
            'name' => 'Updated Name'
        ]);

        $response->assertForbidden();
    }

    /**
     * Test Audit Log Access
     */
    public function test_owner_can_view_audit_logs()
    {
        $response = $this->actingAs($this->owner)->getJson('/api/audit-logs');
        
        $response->assertOk();
    }

    public function test_manager_cannot_view_audit_logs()
    {
        // AuditLog Policy: only Owner/Admin can view
        $response = $this->actingAs($this->manager)->getJson('/api/audit-logs');

        $response->assertForbidden();
    }

    /**
     * Test Cross-Org Isolation
     */
    public function test_owner_cannot_access_other_org_property()
    {
        $otherOrg = Org::factory()->create();
        $otherProperty = Property::factory()->create(['org_id' => $otherOrg->id]);

        $response = $this->actingAs($this->owner)->getJson("/api/properties/{$otherProperty->id}");

        // Subject to Policy implementation checkOrgScope
        $response->assertForbidden(); // Or NotFound depending on logic
    }
}
