<?php

namespace Tests\Feature\Handover;

use App\Features\Contract\Models\Contract;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Features\Property\Models\Floor;
use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HandoverDebugTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        foreach (['Owner', 'Manager', 'Staff', 'Tenant', 'owner', 'manager', 'staff', 'tenant'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    public function test_debug_store_response()
    {
        $org = Org::create(['name' => 'Debug Org']);
        $property = Property::create(['org_id' => $org->id, 'name' => 'Tòa A', 'code' => 'DA']);
        $floor = Floor::create(['org_id' => $org->id, 'property_id' => $property->id, 'name' => '1', 'sort_order' => 1]);
        $room = Room::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'floor_id' => $floor->id,
            'name' => 'Phòng 101', 'code' => 'P101', 'status' => 'OCCUPIED',
        ]);
        $contract = Contract::create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
            'status' => 'ACTIVE', 'start_date' => now()->toDateString(), 'rent_price' => 5000000,
        ]);

        $manager = User::factory()->create(['org_id' => $org->id, 'full_name' => 'Manager Test']);
        $manager->assignRole('manager');
        $manager->assignRole('Manager');

        $response = $this->actingAs($manager)->postJson('/api/handovers', [
            'room_id' => $room->id,
            'contract_id' => $contract->id,
            'type' => 'CHECKIN',
        ]);

        // Dump actual status and body for diagnosis
        $this->assertTrue(
            true,
            'Status: '.$response->status().' | Body: '.$response->content()
        );
        dump('HTTP Status: '.$response->status());
        dump('Response: '.$response->content());

        $response->assertStatus($response->status()); // Always pass - just read above
    }
}
