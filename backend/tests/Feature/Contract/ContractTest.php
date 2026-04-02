<?php

namespace Tests\Feature\Contract;

use App\Features\Contract\Models\Contract;
use App\Features\Contract\Models\ContractMember;
use App\Features\Contract\Enums\ContractStatus;
use App\Features\Property\Models\Room;
use App\Features\Property\Models\Property;
use App\Features\Invoice\Models\Invoice;
use App\Models\User;
use App\Models\Organization\Organization;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;
use function Pest\Laravel\putJson;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;

uses(\Tests\TestCase::class, \Illuminate\Foundation\Testing\RefreshDatabase::class);

test('owner can list contracts', function () {
    $org = Organization::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
    Contract::factory()->count(3)->create([
        'property_id' => $property->id,
        'room_id' => $room->id,
        'org_id' => $org->id
    ]);

    actingAs($owner);
    getJson('/api/contracts')
        ->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

test('owner can create a contract', function () {
    $org = Organization::factory()->create();
    $owner = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Owner']);
    $owner->assignRole($role);

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);
    $tenant = User::factory()->create(['org_id' => $org->id]);

    $contractData = [
        'property_id' => $property->id,
        'room_id' => $room->id,
        'tenant_id' => $tenant->id,
        'start_date' => now()->format('Y-m-d'),
        'end_date' => now()->addYear()->format('Y-m-d'),
        'rent_amount' => 5000000,
        'deposit_amount' => 10000000,
        'billing_cycle' => 'MONTHLY',
    ];

    actingAs($owner);
    postJson('/api/contracts', $contractData)
        ->assertStatus(201);

    assertDatabaseHas('contracts', [
        'property_id' => $property->id,
        'room_id' => $room->id,
        'rent_amount' => 5000000,
    ]);
});

test('admin can confirm payment and activate contract', function () {
    $org = Organization::factory()->create();
    $admin = User::factory()->create(['org_id' => $org->id]);
    $role = Role::firstOrCreate(['name' => 'Admin']);
    $admin->assignRole($role);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'status' => ContractStatus::PENDING_PAYMENT,
    ]);

    actingAs($admin);
    postJson("/api/contracts/{$contract->id}/confirm-payment")
        ->assertStatus(200);

    expect($contract->refresh()->status)->toBe(ContractStatus::ACTIVE);
    expect($contract->room->status)->toBe('occupied');
});
