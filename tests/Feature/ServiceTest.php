<?php

use App\Models\Org\Org;
use App\Models\Service\Service;
use App\Models\Org\User;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;

beforeEach(function () {
    $this->seed(\Database\Seeders\RBACSeeder::class);
});

test('admin can create service with initial rate', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    $response = postJson('/api/services', [
        'code' => 'TEST_SVC',
        'name' => 'Test Service',
        'calc_mode' => 'PER_METER',
        'unit' => 'kwh',
        'price' => 5000,
        'is_recurring' => true,
        'is_active' => true,
    ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.price', '5000.00');

    assertDatabaseHas('services', [
        'code' => 'TEST_SVC',
        'org_id' => $org->id,
    ]);

    $serviceId = $response->json('data.id');

    assertDatabaseHas('service_rates', [
        'service_id' => $serviceId,
        'price' => 5000,
    ]);
});

test('updating price creates new rate history', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    // 1. Create Service
    $response = postJson('/api/services', [
        'code' => 'TEST_SVC_2',
        'name' => 'Test Service 2',
        'calc_mode' => 'PER_METER',
        'unit' => 'kwh',
        'price' => 1000,
    ]);
    
    $serviceId = $response->json('data.id');

    // 2. Update Price
    $updateResponse = putJson("/api/services/{$serviceId}", [
        'price' => 2000,
        'effective_from' => now()->addDay()->toDateString(),
    ]);

    $updateResponse->assertStatus(200);

    // Check DB has 2 rates
    $this->assertDatabaseCount('service_rates', 2);
    
    // Check old rate
    assertDatabaseHas('service_rates', [
        'service_id' => $serviceId,
        'price' => 1000,
    ]);

    // Check new rate
    assertDatabaseHas('service_rates', [
        'service_id' => $serviceId,
        'price' => 2000,
    ]);
});

test('owner can view their services only', function () {
    $org1 = Org::factory()->create();
    $owner1 = User::factory()->create(['org_id' => $org1->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner1->assignRole($role);

    $org2 = Org::factory()->create();
    
    // Create service for Org 2 manually since we don't have Factory for Service yet
    $service2 = Service::create([
        'id' => \Illuminate\Support\Str::uuid(),
        'org_id' => $org2->id,
        'code' => 'SVC_ORG_2',
        'name' => 'Service Org 2',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
    ]);

    actingAs($owner1)
        ->getJson("/api/services/{$service2->id}")
        ->assertStatus(403); // Forbidden
});

test('can soft delete and restore service', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    $response = postJson('/api/services', [
        'code' => 'DEL_SVC',
        'name' => 'Delete Me',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        'price' => 100,
    ]);
    $id = $response->json('data.id');

    // Delete
    deleteJson("/api/services/{$id}")->assertStatus(200);
    $this->assertSoftDeleted('services', ['id' => $id]);

    // Restore
    postJson("/api/services/{$id}/restore")->assertStatus(200);
    $this->assertNotSoftDeleted('services', ['id' => $id]);
});

test('admin can list services of specific org', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    // Create service for this org
    $service = Service::create([
        'id' => \Illuminate\Support\Str::uuid(),
        'org_id' => $org->id,
        'code' => 'ORG_SVC',
        'name' => 'Org Service',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        'price' => 1000,
    ]);

    actingAs($admin);

    $response = getJson("/api/orgs/{$org->id}/services");

    $response->assertStatus(200)
             ->assertJsonFragment(['code' => 'ORG_SVC']);
});

// Search, Filter, Sort, Pagination Tests

test('can search services by name or code', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    Service::factory()->create(['org_id' => $org->id, 'name' => 'Electric Service', 'code' => 'ELEC001']);
    Service::factory()->create(['org_id' => $org->id, 'name' => 'Water Service', 'code' => 'WATER001']);

    // Search by Name
    getJson('/api/services?search=Electric')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['code' => 'ELEC001']);

    // Search by Code
    getJson('/api/services?search=WATER')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Water Service']);
});

test('can filter services', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    Service::factory()->create(['org_id' => $org->id, 'name' => 'Active Svc', 'is_active' => true, 'unit' => 'kwh']);
    Service::factory()->create(['org_id' => $org->id, 'name' => 'Inactive Svc', 'is_active' => false, 'unit' => 'm3']);

    // Filter by is_active
    getJson('/api/services?filter[is_active]=0')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Inactive Svc']);

    // Filter by unit
    getJson('/api/services?filter[unit]=kwh')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonFragment(['name' => 'Active Svc']);
});

test('can sort services', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    Service::factory()->create(['org_id' => $org->id, 'name' => 'A Service', 'code' => 'A001']);
    Service::factory()->create(['org_id' => $org->id, 'name' => 'B Service', 'code' => 'B001']);
    Service::factory()->create(['org_id' => $org->id, 'name' => 'C Service', 'code' => 'C001']);

    // Sort Descending by Code
    $response = getJson('/api/services?sort=-code')
        ->assertStatus(200);
    
    $data = $response->json('data');
    expect($data[0]['code'])->toBe('C001');
    expect($data[1]['code'])->toBe('B001');
    expect($data[2]['code'])->toBe('A001');

    // Sort Ascending by Name
    $response = getJson('/api/services?sort=name')
        ->assertStatus(200);
    
    $data = $response->json('data');
    expect($data[0]['name'])->toBe('A Service');
});

test('can paginate services', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    Service::factory()->count(20)->create(['org_id' => $org->id]);

    $response = getJson('/api/services?per_page=5')
        ->assertStatus(200)
        ->assertJsonCount(5, 'data');
    
    $response->assertJsonPath('meta.per_page', 5)
             ->assertJsonPath('meta.total', 20);
});

test('can filter and sort trashed services', function () {
    $org = Org::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    actingAs($admin);

    $s1 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Deleted A', 'code' => 'DEL001', 'is_active' => false]);
    $s2 = Service::factory()->create(['org_id' => $org->id, 'name' => 'Deleted B', 'code' => 'DEL002', 'is_active' => true]);
    
    $s1->delete();
    $s2->delete();

    // Filter by is_active in trash
    getJson('/api/services/trash?filter[is_active]=0')
        ->assertStatus(200)
        ->assertJsonFragment(['code' => 'DEL001'])
        ->assertJsonMissing(['code' => 'DEL002']);

    // Sort in trash
    $response = getJson('/api/services/trash?sort=-code')
        ->assertStatus(200);
    
    $data = $response->json('data');
    expect($data[0]['code'])->toBe('DEL002');
    expect($data[1]['code'])->toBe('DEL001');
});

// Permission Tests

test('owner can create service', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    actingAs($owner);

    $response = postJson('/api/services', [
        'code' => 'OWNER_SVC',
        'name' => 'Owner Service',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        'price' => 5000,
        'is_recurring' => true,
        'is_active' => true,
    ]);

    $response->assertStatus(201);
    assertDatabaseHas('services', ['code' => 'OWNER_SVC', 'org_id' => $org->id]);
});

test('owner cannot create service without price', function () {
    $org = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    actingAs($owner);

    $response = postJson('/api/services', [
        'code' => 'NO_PRICE_SVC',
        'name' => 'No Price Service',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        // 'price' is missing
    ]);

    $response->assertStatus(422)
             ->assertJsonValidationErrors(['price']);
});

test('owner cannot create service for another org', function () {
    $org1 = Org::factory()->create();
    $owner = User::factory()->create(['org_id' => $org1->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $org2 = Org::factory()->create();

    actingAs($owner);

    // Try to pass org_id of another org
    $response = postJson('/api/services', [
        'org_id' => $org2->id, // Malicious attempt
        'code' => 'HACK_ORG_2',
        'name' => 'Hack Service',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        'price' => 5000,
    ]);

    // System should either ignore org_id input and use user's org_id (201) OR reject (403/422).
    // Our Controller forces: $data['org_id'] = $request->user()->org_id;
    // So it should be created under Org 1, IGNORING the input org_id.
    
    $response->assertStatus(201);
    
    // Assert it was created for ORG 1 (User's Org), NOT Org 2
    assertDatabaseHas('services', [
        'code' => 'HACK_ORG_2', 
        'org_id' => $org1->id 
    ]);
    
    assertDatabaseMissing('services', [
        'code' => 'HACK_ORG_2', 
        'org_id' => $org2->id 
    ]);
});

test('manager can create service', function () {
    $org = Org::factory()->create();
    $manager = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Manager']);
    $manager->assignRole($role);

    actingAs($manager);

    $response = postJson('/api/services', [
        'code' => 'MGR_SVC',
        'name' => 'Manager Service',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        'price' => 3000,
    ]);

    $response->assertStatus(201);
    assertDatabaseHas('services', ['code' => 'MGR_SVC', 'org_id' => $org->id]);
});

test('manager cannot create service for another org', function () {
    $org1 = Org::factory()->create();
    $manager = User::factory()->create(['org_id' => $org1->id]);
    $role = Role::firstOrCreate(['name' => 'Manager']);
    $manager->assignRole($role);

    $org2 = Org::factory()->create();

    actingAs($manager);

    $response = postJson('/api/services', [
        'org_id' => $org2->id,
        'code' => 'MGR_HACK',
        'name' => 'Manager Hack',
        'calc_mode' => 'PER_ROOM',
        'unit' => 'month',
        'price' => 3000,
    ]);

    $response->assertStatus(201);
    
    // Assert it was created for ORG 1
    assertDatabaseHas('services', [
        'code' => 'MGR_HACK', 
        'org_id' => $org1->id 
    ]);
    
    assertDatabaseMissing('services', [
        'code' => 'MGR_HACK', 
        'org_id' => $org2->id 
    ]);
});
