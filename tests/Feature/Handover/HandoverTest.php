<?php

use App\Models\Handover\Handover;
use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Org\User;
use Spatie\Permission\Models\Role;

test('tenant cannot create handover', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'tenant']);
    $tenant->assignRole('tenant');
    
    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
    
    $room = Room::factory()->create([
        'org_id' => $org->id, 
        'property_id' => $property->id,
        'floor_id' => $floor->id,
    ]);
    
    $contract = Contract::factory()->create([
        'org_id' => $org->id, 
        'property_id' => $property->id,
        'room_id' => $room->id
    ]);

    $this->actingAs($tenant)->postJson('/api/handovers', [
        'room_id' => $room->id,
        'contract_id' => $contract->id,
        'type' => 'CHECKIN'
    ])->assertForbidden();
});

test('manager can create handover', function () {
    $org = Org::factory()->create();
    $manager = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'manager']);
    $manager->assignRole('manager');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
    
    $room = Room::factory()->create([
        'org_id' => $org->id, 
        'property_id' => $property->id,
        'floor_id' => $floor->id,
    ]);
    
    $contract = Contract::factory()->create([
        'org_id' => $org->id, 
        'property_id' => $property->id,
        'room_id' => $room->id
    ]);

    $this->actingAs($manager)->postJson('/api/handovers', [
        'room_id' => $room->id,
        'contract_id' => $contract->id,
        'type' => 'CHECKIN',
        'note' => 'Test note'
    ])->assertCreated();

    $this->assertDatabaseHas('handovers', [
        'type' => 'CHECKIN',
        'status' => 'DRAFT',
        'note' => 'Test note'
    ]);
});
