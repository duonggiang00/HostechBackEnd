<?php

use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomTemplate;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

test('building overview sync with same idempotency key does not create duplicate rooms', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole(Role::firstOrCreate(['name' => 'Owner']));

    $property = Property::factory()->create([
        'org_id' => $org->id,
        'area' => 500,
        'shared_area' => 0,
    ]);

    $floor = Floor::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_number' => 4,
        'area' => 200,
        'shared_area' => 0,
    ]);

    $template = RoomTemplate::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'name' => 'Std',
        'area' => 25,
        'capacity' => 1,
        'base_price' => 1_000_000,
    ]);

    $idempotencyKey = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    $payload = [
        'idempotency_key' => $idempotencyKey,
        'sync_data' => [
            [
                'floor_id' => $floor->id,
                'name' => $floor->name,
                'floor_number' => $floor->floor_number,
                'rooms' => [
                    [
                        'temp_id' => 'temp-room-sync-1',
                        'code' => 'R401',
                        'name' => 'R401',
                        'template_id' => $template->id,
                        'x' => 0,
                        'y' => 0,
                        'width' => 1,
                        'height' => 1,
                    ],
                ],
            ],
        ],
    ];

    actingAs($owner);

    postJson("/api/properties/{$property->id}/overview/sync", $payload)
        ->assertSuccessful();

    expect(Room::where('floor_id', $floor->id)->count())->toBe(1);

    postJson("/api/properties/{$property->id}/overview/sync", $payload)
        ->assertSuccessful();

    expect(Room::where('floor_id', $floor->id)->count())->toBe(1);
});

test('same idempotency key with different payload is rejected', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole(Role::firstOrCreate(['name' => 'Owner']));

    $property = Property::factory()->create([
        'org_id' => $org->id,
        'area' => 500,
        'shared_area' => 0,
    ]);

    $floor = Floor::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_number' => 4,
        'area' => 200,
        'shared_area' => 0,
    ]);

    $template = RoomTemplate::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'name' => 'Std',
        'area' => 25,
        'capacity' => 1,
        'base_price' => 1_000_000,
    ]);

    $idempotencyKey = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

    $payloadA = [
        'idempotency_key' => $idempotencyKey,
        'sync_data' => [
            [
                'floor_id' => $floor->id,
                'name' => $floor->name,
                'floor_number' => $floor->floor_number,
                'rooms' => [
                    [
                        'temp_id' => 'temp-1',
                        'code' => 'R401',
                        'name' => 'R401',
                        'template_id' => $template->id,
                        'x' => 0,
                        'y' => 0,
                        'width' => 1,
                        'height' => 1,
                    ],
                ],
            ],
        ],
    ];

    $payloadB = [
        'idempotency_key' => $idempotencyKey,
        'sync_data' => [
            [
                'floor_id' => $floor->id,
                'name' => $floor->name,
                'floor_number' => $floor->floor_number,
                'rooms' => [
                    [
                        'temp_id' => 'temp-2',
                        'code' => 'R402',
                        'name' => 'R402',
                        'template_id' => $template->id,
                        'x' => 1,
                        'y' => 0,
                        'width' => 1,
                        'height' => 1,
                    ],
                ],
            ],
        ],
    ];

    actingAs($owner);

    postJson("/api/properties/{$property->id}/overview/sync", $payloadA)->assertSuccessful();

    postJson("/api/properties/{$property->id}/overview/sync", $payloadB)
        ->assertStatus(422)
        ->assertJsonValidationErrors(['idempotency_key']);

    expect(Room::where('floor_id', $floor->id)->count())->toBe(1);
});

test('same sync payload without idempotency creates duplicate rooms (retry hazard)', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $owner->assignRole(Role::firstOrCreate(['name' => 'Owner']));

    $property = Property::factory()->create([
        'org_id' => $org->id,
        'area' => 500,
        'shared_area' => 0,
    ]);

    $floor = Floor::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_number' => 4,
        'area' => 200,
        'shared_area' => 0,
    ]);

    $template = RoomTemplate::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'name' => 'Std',
        'area' => 25,
        'capacity' => 1,
        'base_price' => 1_000_000,
    ]);

    $payload = [
        'sync_data' => [
            [
                'floor_id' => $floor->id,
                'name' => $floor->name,
                'floor_number' => $floor->floor_number,
                'rooms' => [
                    [
                        'temp_id' => 'temp-room-dup',
                        'code' => 'R401',
                        'name' => 'R401',
                        'template_id' => $template->id,
                        'x' => 0,
                        'y' => 0,
                        'width' => 1,
                        'height' => 1,
                    ],
                ],
            ],
        ],
    ];

    actingAs($owner);

    postJson("/api/properties/{$property->id}/overview/sync", $payload)->assertSuccessful();
    postJson("/api/properties/{$property->id}/overview/sync", $payload)->assertSuccessful();

    expect(Room::where('floor_id', $floor->id)->count())->toBe(2);
});
