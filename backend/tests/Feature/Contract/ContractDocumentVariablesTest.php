<?php

use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Contract\ContractDocumentService;

/** @return array<string, mixed> */
function contractDocumentTemplateVars(Contract $contract, array $extra = []): array
{
    $contract->loadMissing(['members', 'room.services', 'property', 'org', 'createdBy']);
    $svc = app(ContractDocumentService::class);
    $m = new ReflectionMethod(ContractDocumentService::class, 'composeDocumentVariables');
    $m->setAccessible(true);
    /** @var array{0: array<string, mixed>, 1: array<int, string>} $tuple */
    $tuple = $m->invoke($svc, $contract, $extra);

    return $tuple[0];
}

test('document variables map numeric billing_cycle and payment_range for monthly', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'billing_cycle' => '1',
        'due_day' => 7,
        'rent_price' => 5_000_000,
        'base_rent' => 5_000_000,
        'fixed_services_fee' => 500_000,
        'total_rent' => 5_500_000,
        'deposit_amount' => 11_000_000,
    ]);

    $vars = contractDocumentTemplateVars($contract);

    expect($vars['contract_billing_cycle'])->toBe('Hàng tháng')
        ->and($vars['contract_billing_cycle_label'])->toBe('Hàng tháng')
        ->and($vars['payment_range'])->toBe('Trước ngày 7 hàng tháng')
        ->and($vars['contract_deposit_months'])->toBe(2.0);
});

test('document variables for quarterly billing_cycle stored as 3', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'billing_cycle' => '3',
        'due_day' => 5,
        'rent_price' => 4_000_000,
        'base_rent' => 4_000_000,
        'total_rent' => 4_000_000,
        'deposit_amount' => 0,
    ]);

    $vars = contractDocumentTemplateVars($contract);

    expect($vars['contract_billing_cycle'])->toBe('Hàng quý (mỗi 3 tháng)')
        ->and($vars['payment_range'])->toContain('chu kỳ 3 tháng')
        ->and($vars['payment_range'])->toContain('ngày 5');
});

test('document variables for six month billing and legacy MONTHLY alias', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'billing_cycle' => '6',
        'due_day' => 10,
        'rent_price' => 3_000_000,
        'base_rent' => 3_000_000,
        'total_rent' => 3_000_000,
    ]);

    $vars = contractDocumentTemplateVars($contract);

    expect($vars['contract_billing_cycle'])->toBe('Hàng nửa năm (mỗi 6 tháng)')
        ->and($vars['payment_range'])->toContain('chu kỳ 6 tháng');

    $contract->update(['billing_cycle' => 'MONTHLY']);
    $varsMonthly = contractDocumentTemplateVars($contract->fresh());

    expect($varsMonthly['contract_billing_cycle'])->toBe('Hàng tháng');
});

test('deposit months falls back to rent_price when total_rent is zero', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'billing_cycle' => '1',
        'rent_price' => 2_000_000,
        'base_rent' => 2_000_000,
        'fixed_services_fee' => 0,
        'total_rent' => 0,
        'deposit_amount' => 6_000_000,
    ]);

    $vars = contractDocumentTemplateVars($contract);

    expect($vars['contract_deposit_months'])->toBe(3.0);
});

test('deposit months reads directly from column when set (no reverse-calc)', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    // Stored deposit_amount cố tình lệch khỏi tổng (ví dụ phụ phí thay đổi sau ký) —
    // nếu reverse-calc sẽ ra 1.97; với cột mới phải trả về đúng 2 từ DB.
    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'billing_cycle' => '1',
        'rent_price' => 5_000_000,
        'base_rent' => 5_000_000,
        'fixed_services_fee' => 600_000,
        'total_rent' => 5_600_000,
        'deposit_amount' => 11_000_000,
        'deposit_months' => 2,
    ]);

    $vars = contractDocumentTemplateVars($contract);

    expect($vars['contract_deposit_months'])->toBe(2.0)
        ->and($vars['contract_fixed_services_fee'])->toBe('600.000')
        ->and($vars['contract_total_rent'])->toBe('5.600.000')
        ->and($vars['contract_rent_price'])->toBe('5.000.000')
        ->and($vars['contract_deposit_amount'])->toBe('11.000.000');
});
