<?php

use App\Models\Org;
use App\Models\Property;
use App\Models\Room;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class RoomTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    public function test_returns_paginated_rooms_for_tenant(): void
    {
        $org = Org::create(['id' => (string) Str::uuid(), 'name' => 'Tenant B']);

        $property = Property::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'code' => 'PROP1', 'name' => 'Main']);

        // Create a user with Owner role that can view rooms
        $user = User::factory()->create(['org_id' => $org->id]);
        $user->assignRole('Owner');
        $token = $user->createToken('api-token')->plainTextToken;

        Room::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'property_id' => $property->id, 'code' => 'R1', 'name' => 'Room 1', 'base_price' => 100]);
        Room::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'property_id' => $property->id, 'code' => 'R2', 'name' => 'Room 2', 'base_price' => 200]);

        $response = $this
            ->withHeaders([
                'X-Org-Id' => $org->id,
                'Authorization' => "Bearer {$token}",
            ])
            ->getJson('/api/v1/rooms');

        $response->assertStatus(200);
        $response->assertJsonStructure(['data', 'links', 'meta']);
        expect($response->json('meta.per_page'))->toBe(15);
    }
}
