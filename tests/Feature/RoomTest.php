<?php

use App\Models\Org;
use App\Models\Property;
use App\Models\Room;
use Illuminate\Support\Str;

it('returns paginated rooms for tenant', function () {
    $org = Org::create(['id' => (string) Str::uuid(), 'name' => 'Tenant B']);

    $property = Property::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'code' => 'PROP1', 'name' => 'Main']);

    Room::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'property_id' => $property->id, 'code' => 'R1', 'name' => 'Room 1', 'base_price' => 100]);
    Room::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'property_id' => $property->id, 'code' => 'R2', 'name' => 'Room 2', 'base_price' => 200]);

    $response = $this->withHeaders(['X-Org-Id' => $org->id])->getJson('/api/v1/rooms');

    $response->assertStatus(200);
    $response->assertJsonStructure(['data', 'links', 'meta']);
    expect($response->json('meta.per_page'))->toBe(15);
});
