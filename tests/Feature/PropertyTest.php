<?php

use App\Models\Org;
use App\Models\Property;
use App\Models\User;
use Illuminate\Support\Str;

it('returns paginated properties for tenant', function () {
    $org = Org::create(['id' => (string) Str::uuid(), 'name' => 'Tenant A']);

    // Create a user with a Sanctum token
    $user = User::factory()->create(['org_id' => $org->id]);
    $token = $user->createToken('api-token')->plainTextToken;

    Property::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'code' => 'P1', 'name' => 'Prop 1']);
    Property::create(['id' => (string) Str::uuid(), 'org_id' => $org->id, 'code' => 'P2', 'name' => 'Prop 2']);

    $response = $this
        ->withHeaders([
            'X-Org-Id' => $org->id,
            'Authorization' => "Bearer {$token}",
        ])
        ->getJson('/api/v1/properties');

    $response->assertStatus(200);
    $response->assertJsonStructure(['data', 'links', 'meta']);
    expect($response->json('meta.per_page'))->toBe(15);
});
