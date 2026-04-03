<?php

namespace Tests\Feature\Property;

use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Floor;
use App\Features\Property\Models\Room;
use App\Services\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoomFeatureTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected Org $org;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $this->org = Org::factory()->create();
        $this->admin = User::factory()->create(['org_id' => $this->org->id]);
        $this->admin->assignRole('Admin');
        
        // Multi-tenancy context
        TenantManager::setOrgId($this->org->id);
    }

    /** @test */
    public function test_admin_can_list_rooms()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);
        Room::factory()->count(3)->create([
            'org_id' => $this->org->id,
            'property_id' => $property->id
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/rooms');

        $response->assertStatus(200)
            ->assertJsonStructure(['data', 'meta', 'links']);
    }

    /** @test */
    public function test_admin_can_create_room()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);
        $floor = Floor::factory()->create(['property_id' => $property->id]);

        $data = [
            'property_id' => $property->id,
            'floor_id' => $floor->id,
            'code' => 'R-101',
            'name' => 'Room 101',
            'type' => 'studio',
            'capacity' => 2,
            'base_price' => 5000000,
            'status' => 'available',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/rooms', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('rooms', [
            'org_id' => $this->org->id,
            'property_id' => $property->id,
            'code' => 'R-101'
        ]);
        
        // Verify price history was created
        $this->assertDatabaseHas('room_prices', [
            'org_id' => $this->org->id,
            'price' => 5000000,
        ]);
    }

    /** @test */
    public function test_admin_can_quick_create_room_draft()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);

        $data = [
            'property_id' => $property->id,
            'name' => 'Draft Room 1',
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/rooms/quick', $data);

        $response->assertStatus(201);
        $this->assertDatabaseHas('rooms', [
            'org_id' => $this->org->id,
            'name' => 'Draft Room 1', 
            'status' => 'draft'
        ]);
        
        // Assert code was generated
        $this->assertNotNull($response->json('data.code'));
    }

    /** @test */
    public function test_admin_can_publish_draft_room()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);
        $room = Room::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $property->id,
            'status' => 'draft'
        ]);

        $response = $this->actingAs($this->admin)->postJson("/api/rooms/{$room->id}/publish", [
            'code' => 'R-PUBLISHED',
            'base_price' => 6500000,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('rooms', [
            'id' => $room->id,
            'status' => 'available',
            'code' => 'R-PUBLISHED'
        ]);
        
        // Verify price was updated and history recorded in room_prices
        $this->assertDatabaseHas('room_prices', [
            'org_id' => $this->org->id,
            'room_id' => $room->id,
            'price' => 6500000
        ]);
    }

    /** @test */
    public function test_admin_can_batch_create_rooms()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);

        $data = [
            'property_id' => $property->id,
            'prefix' => 'BATCH-',
            'count' => 3,
            'start_number' => 1,
        ];

        $response = $this->actingAs($this->admin)->postJson('/api/rooms/quick-batch', $data);

        $response->assertStatus(200);
        $this->assertEquals(3, Room::where('property_id', $property->id)->count());
        
        // Check that at least one room exists for this property and org
        $this->assertDatabaseHas('rooms', [
            'org_id' => $this->org->id,
            'property_id' => $property->id
        ]);
    }

    /** @test */
    public function test_room_multi_tenancy_isolation()
    {
        // My Org context
        $myProperty = Property::factory()->create(['org_id' => $this->org->id]);
        $myRoom = Room::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $myProperty->id
        ]);

        // Clear context to create other org data
        TenantManager::setOrgId(null);
        
        $otherOrg = Org::factory()->create();
        $otherProperty = Property::factory()->create(['org_id' => $otherOrg->id]);
        $otherRoom = Room::factory()->create([
            'org_id' => $otherOrg->id,
            'property_id' => $otherProperty->id
        ]);
        
        // Final sanity re-set my Org context
        TenantManager::setOrgId($this->org->id);

        // Admin request with X-Org-Id header
        $response = $this->actingAs($this->admin)->getJson('/api/rooms', ['X-Org-Id' => $this->org->id]);

        $response->assertStatus(200);
        $roomIds = collect($response->json('data'))->pluck('id')->toArray();
        
        $this->assertContains((string) $myRoom->id, $roomIds);
        $this->assertNotContains((string) $otherRoom->id, $roomIds);
    }

    /** @test */
    public function test_admin_can_trash_and_restore_room()
    {
        $property = Property::factory()->create(['org_id' => $this->org->id]);
        $room = Room::factory()->create([
            'org_id' => $this->org->id,
            'property_id' => $property->id
        ]);

        // Trash
        $this->actingAs($this->admin)->deleteJson("/api/rooms/{$room->id}")
            ->assertStatus(200);

        $this->assertSoftDeleted('rooms', ['id' => $room->id]);

        // Restore
        $this->actingAs($this->admin)->postJson("/api/rooms/{$room->id}/restore")
            ->assertStatus(200);

        $this->assertNotSoftDeleted('rooms', ['id' => $room->id]);
    }
}
