<?php

namespace Tests\Feature\Property;

use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Floor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PropertyFeatureTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected Org $org;
    protected User $admin;
    protected User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        // Create Roles
        Role::create(['name' => 'Admin', 'guard_name' => 'web']);
        Role::create(['name' => 'Manager', 'guard_name' => 'web']);

        $this->org = Org::factory()->create();
        
        $this->admin = User::factory()->create([
            'org_id' => $this->org->id,
        ]);
        $this->admin->assignRole('Admin');

        $this->manager = User::factory()->create([
            'org_id' => $this->org->id,
        ]);
        $this->manager->assignRole('Manager');
    }

    /**
     * @test
     */
    public function test_admin_can_list_properties()
    {
        Property::factory()->count(3)->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)->getJson('/api/properties');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta', 'links']);
    }

    /**
     * @test
     */
    public function test_multi_tenancy_isolation()
    {
        $otherOrg = Org::factory()->create();
        Property::factory()->create(['org_id' => $this->org->id]);
        Property::factory()->create(['org_id' => $otherOrg->id]);

        $response = $this->actingAs($this->admin)->getJson('/api/properties');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }

    /**
     * @test
     */
    public function test_admin_can_create_property()
    {
        $data = [
            'code' => 'PROP-NEW',
            'name' => 'New Property',
            'address' => '123 Test St',
            'use_floors' => true,
            'default_billing_cycle' => 'MONTHLY',
            'default_due_day' => 5,
            'default_cutoff_day' => 25,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/properties', $data);

        $response->assertStatus(201);

        $this->assertDatabaseHas('properties', [
            'org_id' => $this->org->id,
            'code' => 'PROP-NEW',
        ]);
    }

    /**
     * @test
     */
    public function test_admin_can_update_property()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);

        $response = $this->actingAs($this->admin)->putJson("/api/properties/{$property->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('properties', [
            'id' => $property->id,
            'name' => 'Updated Name',
        ]);
    }

    /**
     * @test
     */
    public function test_admin_can_trash_and_restore_property()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);

        // Trash (returns 204 No Content in this implementation)
        $this->actingAs($this->admin)->deleteJson("/api/properties/{$property->id}")
            ->assertStatus(204);

        $this->assertSoftDeleted('properties', ['id' => $property->id]);

        // Restore
        $this->actingAs($this->admin)->postJson("/api/properties/{$property->id}/restore")
            ->assertStatus(200);

        $this->assertNotSoftDeleted('properties', ['id' => $property->id]);
    }

    /**
     * @test
     */
    public function test_floor_management_crud()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);

        // Create Floor
        $response = $this->actingAs($this->admin)->postJson("/api/properties/{$property->id}/floors", [
            'property_id' => $property->id,
            'code' => 'F1',
            'name' => 'Floor 1',
            'floor_number' => 1,
            'sort_order' => 1,
        ]);

        $response->assertStatus(201);
        $floorId = $response->json('data.id');

        $this->assertDatabaseHas('floors', [
            'property_id' => $property->id,
            'name' => 'Floor 1',
        ]);

        // List Floors
        $this->actingAs($this->admin)->getJson("/api/properties/{$property->id}/floors")
            ->assertStatus(200);

        // Update Floor via own resource endpoint (Update is flat in shallow resource)
        $this->actingAs($this->admin)->putJson("/api/floors/{$floorId}", [
            'property_id' => $property->id,
            'code' => 'F1-UPD',
            'name' => 'Basement',
            'floor_number' => 0,
        ])->assertStatus(200);

        $this->assertDatabaseHas('floors', [
            'id' => $floorId,
            'name' => 'Basement',
        ]);
    }
}
