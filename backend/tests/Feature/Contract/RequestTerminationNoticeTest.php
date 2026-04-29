<?php

use App\Enums\ContractStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

function makeTenantWithActiveContract(?string $endDate = null): array
{
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant', 'guard_name' => 'web']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $endDate ??= now()->addMonths(6)->toDateString();

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'status' => ContractStatus::ACTIVE,
        'start_date' => now()->subMonth()->toDateString(),
        'end_date' => $endDate,
    ]);

    ContractMember::factory()->create([
        'contract_id' => $contract->id,
        'org_id' => $org->id,
        'user_id' => $tenant->id,
        'role' => 'TENANT',
        'is_primary' => true,
        'status' => 'APPROVED',
    ]);

    return compact('tenant', 'contract', 'endDate');
}

test('tenant can submit notice on contract end date with no early warning', function () {
    $ctx = makeTenantWithActiveContract();
    $tenant = $ctx['tenant'];
    $contract = $ctx['contract'];
    $endDate = $ctx['endDate'];

    actingAs($tenant);

    $response = postJson("/api/contracts/{$contract->id}/request-termination", [
        'expected_move_out_date' => $endDate,
        'reason' => 'Kết thúc theo hạn hợp đồng',
    ]);

    $response->assertOk()
        ->assertJsonPath('is_early_termination', false)
        ->assertJsonPath('warnings', [])
        ->assertJsonPath('contract.status', 'PENDING_TERMINATION')
        ->assertJsonPath('contract.expected_move_out_date', $endDate);

    assertDatabaseHas('contracts', [
        'id' => $contract->id,
        'status' => 'PENDING_TERMINATION',
        'expected_move_out_date' => $endDate,
    ]);
});

test('tenant receives early termination warning when move out before end date', function () {
    $endDate = now()->addMonths(6)->toDateString();
    $ctx = makeTenantWithActiveContract($endDate);
    $tenant = $ctx['tenant'];
    $contract = $ctx['contract'];

    actingAs($tenant);

    $earlyDate = now()->addMonth()->toDateString();

    $response = postJson("/api/contracts/{$contract->id}/request-termination", [
        'expected_move_out_date' => $earlyDate,
        'reason' => 'Công việc chuyển đi sớm',
    ]);

    $response->assertOk()
        ->assertJsonPath('is_early_termination', true);

    $warnings = $response->json('warnings');
    expect($warnings)->toBeArray()->not->toBeEmpty();
    expect($warnings[0])->toContain('trước hạn');

    assertDatabaseHas('contracts', [
        'id' => $contract->id,
        'status' => 'PENDING_TERMINATION',
        'expected_move_out_date' => $earlyDate,
    ]);
});

test('non active contract returns validation error', function () {
    $org = Org::factory()->create();
    $tenant = User::factory()->create(['org_id' => $org->id]);
    Role::firstOrCreate(['name' => 'Tenant', 'guard_name' => 'web']);
    $tenant->assignRole('Tenant');

    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'status' => ContractStatus::DRAFT,
        'start_date' => now()->toDateString(),
        'end_date' => now()->addYear()->toDateString(),
    ]);

    ContractMember::factory()->create([
        'contract_id' => $contract->id,
        'org_id' => $org->id,
        'user_id' => $tenant->id,
        'role' => 'TENANT',
        'is_primary' => true,
        'status' => 'APPROVED',
    ]);

    actingAs($tenant);

    postJson("/api/contracts/{$contract->id}/request-termination", [
        'expected_move_out_date' => now()->addMonth()->toDateString(),
        'reason' => 'Test',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});

test('expected move out after contract end is rejected', function () {
    $endDate = now()->addMonths(2)->toDateString();
    $ctx = makeTenantWithActiveContract($endDate);
    $tenant = $ctx['tenant'];
    $contract = $ctx['contract'];

    actingAs($tenant);

    postJson("/api/contracts/{$contract->id}/request-termination", [
        'expected_move_out_date' => now()->addMonths(3)->toDateString(),
        'reason' => 'Sai ngày',
    ])->assertStatus(422)
        ->assertJsonValidationErrors(['expected_move_out_date']);
});
