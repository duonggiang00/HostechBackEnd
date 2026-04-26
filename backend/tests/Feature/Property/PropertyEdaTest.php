<?php

use App\Events\Property\RoomCreated;
use App\Events\Property\RoomUpdated;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Property\RoomService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Cache;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
    $this->roomService = app(RoomService::class);
    
    $this->admin = User::factory()->admin()->create();
    $this->org = Org::factory()->create();
    $this->property = Property::factory()->create(['org_id' => $this->org->id]);
});

test('creating a room dispatches RoomCreated event', function () {
    Event::fake();

    $this->actingAs($this->admin);
    $this->roomService->create([
        'property_id' => $this->property->id,
        'name' => 'EDA Room',
        'code' => 'EDA-001',
        'status' => 'available',
        'base_price' => 1000,
    ], $this->admin);

    Event::assertDispatched(RoomCreated::class);
});

test('InitializeRoomServices listener creates default meters and history', function () {
    config(['queue.default' => 'sync']);

    $this->actingAs($this->admin);
    $room = $this->roomService->create([
        'property_id' => $this->property->id,
        'name' => 'Auto Resource Room',
        'code' => 'AUTO-001',
        'status' => 'available',
        'base_price' => 5000000,
    ], $this->admin);

    // 1. Verify Meters (Electric & Water)
    $this->assertDatabaseHas('meters', [
        'room_id' => $room->id,
        'type' => 'ELECTRIC',
    ]);
    
    $this->assertDatabaseHas('meters', [
        'room_id' => $room->id,
        'type' => 'WATER',
    ]);

    // 2. Verify Price History
    $this->assertDatabaseHas('room_prices', [
        'room_id' => $room->id,
        'price' => 5000000,
        'created_by_user_id' => $this->admin->id,
    ]);

    // 3. Verify Status History
    $this->assertDatabaseHas('room_status_histories', [
        'room_id' => $room->id,
        'to_status' => 'available',
        'changed_by_user_id' => $this->admin->id,
    ]);
});

test('update room status dispatches RoomUpdated event with correctly detected changes', function () {
    $room = Room::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'status' => 'draft'
    ]);

    Event::fake();

    $this->actingAs($this->admin);
    $this->roomService->update($room->id, [
        'status' => 'available'
    ], $this->admin);

    Event::assertDispatched(RoomUpdated::class, function ($event) {
        return isset($event->changes['status']) && $event->changes['status'] === 'available';
    });
});

test('field-aware cache busting optimizes building overview performance', function () {
    $cacheKey = "building_overview_{$this->property->id}";
    Cache::put($cacheKey, 'stale-data');

    config(['queue.default' => 'sync']);

    $room = Room::factory()->create([
        'org_id' => $this->org->id,
        'property_id' => $this->property->id,
        'status' => 'draft',
        'area' => 50
    ]);

    $this->actingAs($this->admin);
    
    // Refresh cache key (factory creation might have cleared it via its own events if registered)
    Cache::put($cacheKey, 'test-data');
    
    // 1. Update non-impactful field (area) -> Cache should NOT be cleared
    $this->roomService->update($room->id, ['area' => 60], $this->admin);
    expect(Cache::has($cacheKey))->toBeTrue();

    // 2. Update impactful field (status) -> Cache SHOULD be cleared
    $this->roomService->update($room->id, ['status' => 'available'], $this->admin);
    expect(Cache::has($cacheKey))->toBeFalse();
});
