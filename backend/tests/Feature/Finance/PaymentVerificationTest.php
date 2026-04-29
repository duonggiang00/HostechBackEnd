<?php

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentAllocation;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\postJson;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

/**
 * @return array{
 *   org: Org,
 *   staff: User,
 *   manager: User,
 *   tenant: User,
 *   property: Property,
 *   room: Room,
 *   contract: Contract,
 *   invoice: Invoice,
 * }
 */
function paymentVerificationSetup(): array
{
    $org = Org::factory()->create();
    $staff = User::factory()->create(['org_id' => $org->id]);
    $staff->assignRole(Role::firstOrCreate(['name' => 'Staff']));
    $manager = User::factory()->create(['org_id' => $org->id]);
    $manager->assignRole(Role::firstOrCreate(['name' => 'Manager']));
    $tenant = User::factory()->create(['org_id' => $org->id]);
    $tenant->assignRole(Role::firstOrCreate(['name' => 'Tenant']));

    $property = Property::factory()->create(['org_id' => $org->id]);
    $floor = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
    $room = Room::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'floor_id' => $floor->id,
    ]);

    $property->managers()->syncWithoutDetaching([(string) $staff->id, (string) $manager->id]);

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
        'full_name' => $tenant->full_name ?? 'Tenant',
        'status' => 'APPROVED',
        'is_primary' => true,
    ]);

    $invoice = Invoice::factory()->issued()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'contract_id' => $contract->id,
        'total_amount' => 1_000_000,
        'paid_amount' => 0,
    ]);

    return compact('org', 'staff', 'manager', 'tenant', 'property', 'room', 'contract', 'invoice');
}

function createTenantProofPayment(
    Org $org,
    Property $property,
    User $tenant,
    Invoice $invoice,
    int $amount = 500_000,
    bool $submittedByTenant = true,
): Payment {
    $payment = Payment::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'payer_user_id' => $tenant->id,
        'received_by_user_id' => $tenant->id,
        'method' => 'TRANSFER',
        'amount' => $amount,
        'status' => 'PENDING',
        'meta' => array_filter([
            'submitted_by_tenant' => $submittedByTenant,
            'submitted_at' => now()->toIso8601String(),
            'invoice_review' => [
                [
                    'invoice_id' => $invoice->id,
                    'previous_status' => $invoice->status,
                ],
            ],
        ]),
    ]);

    PaymentAllocation::create([
        'org_id' => $org->id,
        'payment_id' => $payment->id,
        'invoice_id' => $invoice->id,
        'amount' => $amount,
    ]);

    return $payment;
}

test('staff can approve tenant proof payment in scope', function () {
    $s = paymentVerificationSetup();
    $payment = createTenantProofPayment($s['org'], $s['property'], $s['tenant'], $s['invoice']);

    actingAs($s['staff']);

    postJson("/api/finance/payment-verifications/{$payment->id}/approve", [])
        ->assertOk()
        ->assertJsonPath('data.status', 'APPROVED');

    expect($payment->fresh()->status)->toBe('APPROVED');
});

test('staff can reject tenant proof payment in scope', function () {
    $s = paymentVerificationSetup();
    $payment = createTenantProofPayment($s['org'], $s['property'], $s['tenant'], $s['invoice']);

    actingAs($s['staff']);

    postJson("/api/finance/payment-verifications/{$payment->id}/reject", [
        'reason' => 'Ảnh không rõ',
    ])
        ->assertOk()
        ->assertJsonPath('data.status', 'REJECTED');
});

test('manager can approve tenant proof payment', function () {
    $s = paymentVerificationSetup();
    $payment = createTenantProofPayment($s['org'], $s['property'], $s['tenant'], $s['invoice']);

    actingAs($s['manager']);

    postJson("/api/finance/payment-verifications/{$payment->id}/approve", [])
        ->assertOk()
        ->assertJsonPath('data.status', 'APPROVED');
});

test('staff cannot approve payment on property they are not assigned to', function () {
    $s = paymentVerificationSetup();

    $otherProperty = Property::factory()->create(['org_id' => $s['org']->id]);
    $floor = Floor::factory()->create(['org_id' => $s['org']->id, 'property_id' => $otherProperty->id]);
    $otherRoom = Room::factory()->create([
        'org_id' => $s['org']->id,
        'property_id' => $otherProperty->id,
        'floor_id' => $floor->id,
    ]);

    $otherContract = Contract::factory()->create([
        'org_id' => $s['org']->id,
        'property_id' => $otherProperty->id,
        'room_id' => $otherRoom->id,
        'status' => 'ACTIVE',
    ]);

    ContractMember::create([
        'org_id' => $s['org']->id,
        'contract_id' => $otherContract->id,
        'user_id' => $s['tenant']->id,
        'full_name' => 'Tenant',
        'status' => 'APPROVED',
        'is_primary' => true,
    ]);

    $otherInvoice = Invoice::factory()->issued()->create([
        'org_id' => $s['org']->id,
        'property_id' => $otherProperty->id,
        'room_id' => $otherRoom->id,
        'contract_id' => $otherContract->id,
        'total_amount' => 1_000_000,
        'paid_amount' => 0,
    ]);

    $payment = createTenantProofPayment($s['org'], $otherProperty, $s['tenant'], $otherInvoice);

    actingAs($s['staff']);

    postJson("/api/finance/payment-verifications/{$payment->id}/approve", [])
        ->assertForbidden();
});

test('staff cannot approve pending payment without tenant proof meta', function () {
    $s = paymentVerificationSetup();
    $payment = createTenantProofPayment($s['org'], $s['property'], $s['tenant'], $s['invoice'], 500_000, false);

    actingAs($s['staff']);

    postJson("/api/finance/payment-verifications/{$payment->id}/approve", [])
        ->assertForbidden();
});
