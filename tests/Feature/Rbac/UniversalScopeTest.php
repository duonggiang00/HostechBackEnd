<?php

namespace Tests\Feature\Rbac;

use App\Models\Org;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UniversalScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    /**
     * RESOURCE: PROPERTY
     * Verify Owner cannot create property for another org
     */
    public function test_owner_cannot_create_property_for_other_org()
    {
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');

        $org2 = Org::factory()->create();

        // Even if we pass org_id, controller should override or block
        // PropertyController logic: if user->org_id, use it. But what if we try to sneak?
        // Actually PropertyController forces `data['org_id'] = user->org_id`.
        // So if I send org2->id, it should be ignored and created for org1.
        // OR it should fail if validation requires org_id to be something else?
        // Let's see if we can create one purporting to be for org2.

        $response = $this->actingAs($owner)->postJson('/api/properties', [
            'name' => 'Sneaky Property',
            'code' => 'SP-001',
            'org_id' => $org2->id // Trying to inject
        ]);
        
        // It might succeed (201) but the org_id should be FORCED to org1.
        // So we assertCreated, then check DB.
        $response->assertCreated();
        
        $this->assertDatabaseHas('properties', [
            'name' => 'Sneaky Property',
            'org_id' => $org1->id // MUST be org1
        ]);
        
        $this->assertDatabaseMissing('properties', [
            'name' => 'Sneaky Property',
            'org_id' => $org2->id
        ]);
    }

    /**
     * RESOURCE: ORG
     * Verify Owner cannot update other org
     */
    public function test_owner_cannot_update_other_org()
    {
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');

        $org2 = Org::factory()->create();

        $response = $this->actingAs($owner)->putJson("/api/orgs/{$org2->id}", [
            'name' => 'Hacked Name'
        ]);

        $response->assertForbidden();
    }
    
    /**
     * RESOURCE: ORG
     * Verify Owner cannot delete other org
     */
    public function test_owner_cannot_delete_other_org()
    {
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');

        $org2 = Org::factory()->create();

        $response = $this->actingAs($owner)->deleteJson("/api/orgs/{$org2->id}");

        $response->assertForbidden();
    }

    /**
     * RESOURCE: PROPERTY LIST
     * Verify Owner lists only own properties
     */
    public function test_owner_lists_only_own_properties()
    {
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');
        $p1 = Property::factory()->create(['org_id' => $org1->id]);

        $org2 = Org::factory()->create();
        $p2 = Property::factory()->create(['org_id' => $org2->id]);

        $response = $this->actingAs($owner)->getJson('/api/properties');

        $response->assertOk();
        $response->assertJsonFragment(['id' => $p1->id]);
        $response->assertJsonMissing(['id' => $p2->id]);
    }
}
