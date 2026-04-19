<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomTemplate;
use App\Models\Service\Service;
use App\Services\Property\RoomService;

use function Pest\Laravel\actingAs;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
    $this->roomService = app(RoomService::class);
});

test('room without template inherits property default services', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    
    // Create some default services for the property
    $service1 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Electricity']);
    $service2 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Water']);
    $property->defaultServices()->attach([$service1->id, $service2->id]);

    actingAs($admin);

    // Create a room without any specific services or template
    $room = $this->roomService->create([
        'property_id' => $property->id,
        'name' => 'Normal Room',
        'code' => 'N-001',
        'status' => 'available',
    ], $admin);

    // Verify it inherited Property defaults via InitializeRoomServices listener
    expect($room->services()->count())->toBe(2);
    expect($room->services->pluck('id')->toArray())->toContain($service1->id, $service2->id);
});

test('room with template inherits template services and SKIPS property defaults', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    
    // Property defaults
    $propService1 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Default Electricity']);
    $property->defaultServices()->attach([$propService1->id]);

    // Template specific services
    $tplService1 = Service::factory()->create(['org_id' => $org->id, 'name' => 'VIP Service']);
    $template = RoomTemplate::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'name' => 'VIP Template',
        'area' => 50,
        'capacity' => 2,
        'base_price' => 5000000,
    ]);
    $template->services()->attach([$tplService1->id]);

    actingAs($admin);

    // Create room from template
    $room = $this->roomService->createFromTemplate($template->id, [
        'name' => 'VIP Room',
        'code' => 'V-001',
    ], $admin);

    // Verify it inherited Template services
    expect($room->services()->count())->toBe(1);
    expect($room->services->pluck('id')->toArray())->toContain($tplService1->id);
    
    // Verify it DID NOT inherit Property defaults (the fix!)
    expect($room->services->pluck('id')->toArray())->not->toContain($propService1->id);
});

test('quickCreateBatch respects template services and skips property defaults', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    
    // Property defaults
    $propService1 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Default Electricity']);
    $property->defaultServices()->attach([$propService1->id]);

    // Template specific services
    $tplService1 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Standard Service']);
    $template = RoomTemplate::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'name' => 'Standard Template',
        'area' => 20,
        'capacity' => 1,
        'base_price' => 2000000,
    ]);
    $template->services()->attach([$tplService1->id]);

    actingAs($admin);

    // Batch create from template
    $rooms = $this->roomService->quickCreateBatch([
        'property_id' => $property->id,
        'template_id' => $template->id,
        'count' => 2,
        'prefix' => 'Room',
        'start_number' => 101,
    ], $admin);

    expect($rooms)->toHaveCount(2);

    foreach ($rooms as $room) {
        // Verify it inherited Template services
        expect($room->services()->count())->toBe(1);
        expect($room->services->pluck('id')->toArray())->toContain($tplService1->id);
        
        // Verify it DID NOT inherit Property defaults
        expect($room->services->pluck('id')->toArray())->not->toContain($propService1->id);
    }
});
