<?php

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Finance\Payment;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Database\Seeders\RBACSeeder;
use Illuminate\Support\Facades\Artisan;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\putJson;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
    Artisan::call('rbac:sync');
});

/**
 * Build org + property + room + ACTIVE contract + approved primary tenant + staff on property.
 *
 * @return array{org: Org, property: Property, room: Room, contract: Contract, tenant: User, staff: User, manager: User, strangerTenant: User}
 */
function rbacMatrixScenario(): array
{
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
    $room = Room::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_id' => $floor->id,
    ]);

    $staff = User::factory()->create(['org_id' => $org->id]);
    $staff->assignRole('Staff');
    $property->managers()->syncWithoutDetaching([(string) $staff->id]);

    $manager = User::factory()->create(['org_id' => $org->id]);
    $manager->assignRole('Manager');
    $property->managers()->syncWithoutDetaching([(string) $manager->id]);

    $tenant = User::factory()->create(['org_id' => $org->id]);
    $tenant->assignRole('Tenant');

    $strangerTenant = User::factory()->create(['org_id' => $org->id]);
    $strangerTenant->assignRole('Tenant');

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'status' => 'ACTIVE',
    ]);

    ContractMember::create([
        'org_id' => $org->id,
        'contract_id' => $contract->id,
        'user_id' => $tenant->id,
        'full_name' => $tenant->full_name,
        'status' => 'APPROVED',
        'is_primary' => true,
    ]);

    return compact('org', 'property', 'room', 'contract', 'tenant', 'staff', 'manager', 'strangerTenant');
}

test('staff can view contract in scope tenant cannot delete contract', function () {
    $s = rbacMatrixScenario();

    actingAs($s['staff']);
    getJson("/api/contracts/{$s['contract']->id}")
        ->assertOk();

    actingAs($s['tenant']);
    deleteJson("/api/contracts/{$s['contract']->id}")
        ->assertForbidden();
});

test('tenant can view their contract', function () {
    $s = rbacMatrixScenario();

    actingAs($s['tenant']);
    getJson("/api/contracts/{$s['contract']->id}")
        ->assertOk();
});

test('staff can list invoices with org header stranger tenant cannot view invoice', function () {
    $s = rbacMatrixScenario();

    $invoice = Invoice::factory()->create([
        'org_id' => $s['org']->id,
        'property_id' => $s['property']->id,
        'room_id' => $s['room']->id,
        'contract_id' => $s['contract']->id,
        'status' => 'ISSUED',
        'total_amount' => 1_000_000,
        'paid_amount' => 0,
    ]);

    actingAs($s['staff']);
    getJson('/api/invoices', ['X-Org-Id' => $s['org']->id])
        ->assertOk();

    actingAs($s['strangerTenant']);
    getJson("/api/invoices/{$invoice->id}", ['X-Org-Id' => $s['org']->id])
        ->assertForbidden();
});

test('staff can view payment in property scope tenant cannot view other payer payment', function () {
    $s = rbacMatrixScenario();

    $payment = Payment::create([
        'org_id' => $s['org']->id,
        'property_id' => $s['property']->id,
        'payer_user_id' => $s['manager']->id,
        'received_by_user_id' => $s['manager']->id,
        'method' => 'CASH',
        'amount' => 500_000,
        'reference' => 'RBAC-MATRIX-1',
        'received_at' => now(),
        'status' => 'APPROVED',
    ]);

    actingAs($s['staff']);
    getJson("/api/finance/payments/{$payment->id}")
        ->assertOk();

    actingAs($s['tenant']);
    getJson("/api/finance/payments/{$payment->id}")
        ->assertForbidden();
});

test('staff can view room on assigned property tenant cannot update property', function () {
    $s = rbacMatrixScenario();

    actingAs($s['staff']);
    getJson("/api/rooms/{$s['room']->id}")
        ->assertOk();

    actingAs($s['tenant']);
    putJson("/api/properties/{$s['property']->id}", [
        'name' => 'Renamed by tenant attempt',
    ])->assertForbidden();
});
