<?php

use App\Models\Contract\Contract;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Service\RoomService;
use App\Models\Service\Service;
use App\Models\Service\ServiceRate;
use Database\Seeders\RBACSeeder;
use Spatie\Permission\Models\Permission;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

test('property generate monthly returns sync success failed and errors when one contract lacks approved meter reading', function () {
    $org = Org::factory()->create();
    $operator = User::factory()->admin()->create();
    $operator->syncPermissions(Permission::all());

    $property = Property::factory()->create(['org_id' => $org->id]);
    $roomOk = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
    $roomBad = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $electricService = Service::factory()->electric()->create(['org_id' => $org->id]);
    ServiceRate::create([
        'org_id' => $org->id,
        'service_id' => $electricService->id,
        'effective_from' => '2020-01-01',
        'price' => 3500,
        'created_by_user_id' => $operator->id,
    ]);

    foreach ([$roomOk, $roomBad] as $room) {
        RoomService::create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'service_id' => $electricService->id,
            'quantity' => 1,
        ]);
    }

    $meterOk = Meter::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $roomOk->id,
        'type' => 'ELECTRIC',
        'is_active' => true,
        'base_reading' => 100,
    ]);

    Meter::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $roomBad->id,
        'type' => 'ELECTRIC',
        'is_active' => true,
        'base_reading' => 100,
    ]);

    MeterReading::create([
        'org_id' => $org->id,
        'meter_id' => $meterOk->id,
        'period_start' => '2024-01-01',
        'period_end' => '2024-01-31',
        'reading_value' => 150,
        'consumption' => 50,
        'status' => 'APPROVED',
        'submitted_by_user_id' => $operator->id,
        'submitted_at' => now(),
        'approved_by_user_id' => $operator->id,
        'approved_at' => now(),
    ]);

    Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $roomOk->id,
        'status' => 'ACTIVE',
        'start_date' => '2023-01-01',
        'end_date' => null,
        'base_rent' => 3_000_000,
        'billing_cycle' => 'MONTHLY',
        'rent_token_balance' => 0,
        'created_by_user_id' => $operator->id,
    ]);

    Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $roomBad->id,
        'status' => 'ACTIVE',
        'start_date' => '2023-01-01',
        'end_date' => null,
        'base_rent' => 3_000_000,
        'billing_cycle' => 'MONTHLY',
        'rent_token_balance' => 0,
        'created_by_user_id' => $operator->id,
    ]);

    actingAs($operator);

    $response = postJson("/api/properties/{$property->id}/invoices/generate-monthly", [
        'billing_date' => '2024-01-15',
    ], [
        'X-Org-Id' => $org->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('count', 1)
        ->assertJsonPath('failed', 1)
        ->assertJsonPath('total', 2);

    $errors = $response->json('errors');
    expect($errors)->toBeArray()->not->toBeEmpty();
    expect($errors[0])->toContain('Phòng');
    expect($errors[0])->toContain('Điện');
});

test('property generate monthly accepts LOCKED meter reading for same period', function () {
    $org = Org::factory()->create();
    $operator = User::factory()->admin()->create();
    $operator->syncPermissions(Permission::all());

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $electricService = Service::factory()->electric()->create(['org_id' => $org->id]);
    ServiceRate::create([
        'org_id' => $org->id,
        'service_id' => $electricService->id,
        'effective_from' => '2020-01-01',
        'price' => 3500,
        'created_by_user_id' => $operator->id,
    ]);

    RoomService::create([
        'org_id' => $org->id,
        'room_id' => $room->id,
        'service_id' => $electricService->id,
        'quantity' => 1,
    ]);

    $meter = Meter::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'type' => 'ELECTRIC',
        'is_active' => true,
        'base_reading' => 100,
    ]);

    MeterReading::create([
        'org_id' => $org->id,
        'meter_id' => $meter->id,
        'period_start' => '2024-01-01',
        'period_end' => '2024-01-31',
        'reading_value' => 150,
        'consumption' => 50,
        'status' => 'LOCKED',
        'submitted_by_user_id' => $operator->id,
        'submitted_at' => now(),
        'approved_by_user_id' => $operator->id,
        'approved_at' => now(),
    ]);

    Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'status' => 'ACTIVE',
        'start_date' => '2023-01-01',
        'end_date' => null,
        'base_rent' => 3_000_000,
        'billing_cycle' => 'MONTHLY',
        'rent_token_balance' => 0,
        'created_by_user_id' => $operator->id,
    ]);

    actingAs($operator);

    $response = postJson("/api/properties/{$property->id}/invoices/generate-monthly", [
        'billing_date' => '2024-01-15',
    ], [
        'X-Org-Id' => $org->id,
    ]);

    $response->assertOk()
        ->assertJsonPath('count', 1)
        ->assertJsonPath('failed', 0)
        ->assertJsonPath('total', 1);
});
