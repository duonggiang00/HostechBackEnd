<?php

namespace Tests\Feature\Rbac;

use App\Models\Org;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ResourceCreationScopeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    public function test_owner_cannot_create_floor_in_other_org_property()
    {
        // Org 1 & Owner
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');

        // Org 2 & Property
        $org2 = Org::factory()->create();
        $otherProperty = Property::factory()->create(['org_id' => $org2->id]);

        // Owner tries to create floor in Org 2's property
        $response = $this->actingAs($owner)->postJson('/api/floors', [
            'property_id' => $otherProperty->id,
            'name' => 'Intruder Floor',
            'code' => 'IF-001',
            'sort_order' => 1
        ]);

        // Expect Forbidden (403) or Validation Error (422) if scoped
        // Currently expecting 403 based on Policy or Controller check
        $response->assertStatus(403);
    }

    public function test_owner_cannot_create_room_in_other_org_property()
    {
        // Org 1 & Owner
        $org1 = Org::factory()->create();
        $owner = User::factory()->create(['org_id' => $org1->id]);
        $owner->assignRole('Owner');

        // Org 2 & Property
        $org2 = Org::factory()->create();
        $otherProperty = Property::factory()->create(['org_id' => $org2->id]);

        // Owner tries to create room in Org 2's property
        $response = $this->actingAs($owner)->postJson('/api/rooms', [
            'property_id' => $otherProperty->id,
            'name' => 'Intruder Room',
            'code' => 'IR-001',
            'base_price' => 1000000,
            'status' => 'available'
        ]);

        $response->assertStatus(403);
    }

    public function test_owner_requires_property_id_to_create_room()
    {
         $org = Org::factory()->create();
         $owner = User::factory()->create(['org_id' => $org->id]);
         $owner->assignRole('Owner');

         $response = $this->actingAs($owner)->postJson('/api/rooms', [
             // missing property_id
             'name' => 'No Property Room',
             'code' => 'NPR-001',
             'base_price' => 1000000
         ]);

         $response->assertStatus(422);
         $response->assertJsonValidationErrors('property_id');
    }
}
