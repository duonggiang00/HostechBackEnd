<?php

use App\Models\Org;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class PropertyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\RBACSeeder::class);
    }

    public function test_returns_paginated_properties_for_tenant(): void
    {
        $org = Org::create(['id' => (string) Str::uuid(), 'name' => 'Tenant A']);

        // Create a user with Owner role (has property viewing permission)
        $user = User::factory()->create(['org_id' => $org->id]);
        $user->assignRole('Owner');
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
    }
}
