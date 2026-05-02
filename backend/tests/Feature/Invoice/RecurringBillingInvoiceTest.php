<?php

use App\Enums\InvoiceItemType;
use App\Models\Contract\Contract;
use App\Models\Invoice\InvoiceItem;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Invoice\RecurringBillingService;
use Carbon\Carbon;
use Database\Seeders\RBACSeeder;

beforeEach(function () {
    $this->seed(RBACSeeder::class);
});

test('billing cycle 3 charges rent and adds rent tokens when balance is zero', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'status' => 'ACTIVE',
        'billing_cycle' => '3',
        'rent_token_balance' => 0,
        'base_rent' => 3_000_000,
        'rent_price' => 3_000_000,
        'total_rent' => 3_000_000,
        'fixed_services_fee' => 0,
        'start_date' => now()->subMonths(2)->startOfMonth()->toDateString(),
        'next_billing_date' => now()->addMonth()->toDateString(),
    ]);

    $period = Carbon::parse(now()->format('Y-m-01'));

    app(RecurringBillingService::class)->generateInvoiceForContract($contract, $period);

    $contract->refresh();
    expect($contract->rent_token_balance)->toBe(2);

    $rentItems = InvoiceItem::query()
        ->whereHas('invoice', fn ($q) => $q->where('contract_id', $contract->id))
        ->where('type', InvoiceItemType::RENT->value)
        ->get();

    expect($rentItems)->not->toBeEmpty();
    expect((float) $rentItems->first()->amount)->toBe(9_000_000.0);
});

test('billing consumes rent token and omits rent line', function () {
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create(['property_id' => $property->id, 'org_id' => $org->id]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'status' => 'ACTIVE',
        'billing_cycle' => '3',
        'rent_token_balance' => 1,
        'base_rent' => 3_000_000,
        'rent_price' => 3_000_000,
        'total_rent' => 3_000_000,
        'fixed_services_fee' => 0,
        'start_date' => now()->subMonths(2)->startOfMonth()->toDateString(),
        'next_billing_date' => now()->addMonth()->toDateString(),
    ]);

    $period = Carbon::parse(now()->addMonth()->format('Y-m-01'));

    app(RecurringBillingService::class)->generateInvoiceForContract($contract, $period);

    $contract->refresh();
    expect($contract->rent_token_balance)->toBe(0);

    $rentItems = InvoiceItem::query()
        ->whereHas('invoice', fn ($q) => $q->where('contract_id', $contract->id))
        ->where('type', InvoiceItemType::RENT->value)
        ->get();

    expect($rentItems)->toBeEmpty();
});
