<?php

use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\Floor;
use App\Models\Property\RoomAsset;
use App\Models\Org\User;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
});

test('admin can manage room assets', function () {
    $admin = User::factory()->admin()->create();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
    $room = Room::factory()->create([
        'property_id' => $property->id, 
        'org_id' => $org->id, 
        'floor_id' => $floor->id
    ]);

    actingAs($admin);

    // Create Asset
    $response = postJson("/api/properties/{$property->id}/rooms/{$room->id}/assets", [
        'name' => 'Tivi Samsung 55 Inch',
        'serial' => 'SN-111222',
        'condition' => 'Mới',
        'purchased_at' => '2024-01-01',
    ]);
    
    $response->assertStatus(201);
    $assetId = $response->json('data.id');

    // Read details
    getJson("/api/properties/{$property->id}/rooms/{$room->id}/assets/{$assetId}")
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Tivi Samsung 55 Inch']);

    // List all room assets
    $totalAssetsCount = RoomAsset::where('room_id', $room->id)->count();
    getJson("/api/properties/{$property->id}/rooms/{$room->id}/assets")
        ->assertStatus(200)
        ->assertJsonCount($totalAssetsCount, 'data');

    // Update Asset
    putJson("/api/properties/{$property->id}/rooms/{$room->id}/assets/{$assetId}", [
        'name' => 'Tivi LG 55 Inch',
        'condition' => 'Đã qua sử dụng'
    ])
        ->assertStatus(200)
        ->assertJsonFragment(['name' => 'Tivi LG 55 Inch']);

    // Delete Asset
    deleteJson("/api/properties/{$property->id}/rooms/{$room->id}/assets/{$assetId}")
        ->assertStatus(204);

    // Verify deletion
    $this->assertDatabaseMissing('room_assets', [
        'id' => $assetId,
        'deleted_at' => null // since soft deletes
    ]);
});
