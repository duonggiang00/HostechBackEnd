<?php

namespace Tests\Feature\Finance;

use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\LedgerEntry;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\TenantManager;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class LedgerIndexAndRefundReceiptsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
    }

    public function test_ledger_index_full_returns_both_double_entry_lines(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $paymentId = (string) Str::uuid();

        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => $paymentId,
            'debit' => 4_895_000,
            'credit' => 0,
            'occurred_at' => now(),
            'meta' => [
                'account' => LedgerEntry::ACCOUNT_CASH_BANK,
                'property_id' => $property->id,
            ],
        ]);
        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => $paymentId,
            'debit' => 0,
            'credit' => 4_895_000,
            'occurred_at' => now(),
            'meta' => [
                'account' => LedgerEntry::ACCOUNT_ACCOUNTS_RECEIVABLE,
                'property_id' => $property->id,
            ],
        ]);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->getJson('/api/finance/ledger?per_page=50');

        $response->assertOk();
        $this->assertSame(2, $response->json('meta.total'));
    }

    public function test_ledger_index_cashflow_returns_only_cash_bank_line(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $paymentId = (string) Str::uuid();

        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => $paymentId,
            'debit' => 4_895_000,
            'credit' => 0,
            'occurred_at' => now(),
            'meta' => [
                'account' => LedgerEntry::ACCOUNT_CASH_BANK,
                'property_id' => $property->id,
            ],
        ]);
        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => $paymentId,
            'debit' => 0,
            'credit' => 4_895_000,
            'occurred_at' => now(),
            'meta' => [
                'account' => LedgerEntry::ACCOUNT_ACCOUNTS_RECEIVABLE,
                'property_id' => $property->id,
            ],
        ]);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->getJson('/api/finance/ledger?per_page=50&filter[view]=cashflow');

        $response->assertOk();
        $this->assertSame(1, $response->json('meta.total'));
        $this->assertSame(4_895_000.0, (float) $response->json('data.0.debit'));
    }

    public function test_refund_receipts_index_lists_by_org_and_property_filter(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $propertyA = Property::factory()->create(['org_id' => $org->id, 'name' => 'Tòa A']);
        $propertyB = Property::factory()->create(['org_id' => $org->id, 'name' => 'Tòa B']);
        $floorA = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $propertyA->id]);
        $roomA = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $propertyA->id,
            'floor_id' => $floorA->id,
            'name' => 'P.101',
        ]);
        $floorB = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $propertyB->id]);
        $roomB = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $propertyB->id,
            'floor_id' => $floorB->id,
            'name' => 'P.202',
        ]);

        $contractA = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $propertyA->id,
            'room_id' => $roomA->id,
            'deposit_status' => DepositStatus::REFUND_PENDING,
            'refunded_amount' => 1_000_000,
        ]);
        $contractB = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $propertyB->id,
            'room_id' => $roomB->id,
            'deposit_status' => DepositStatus::REFUND_PENDING,
            'refunded_amount' => 2_000_000,
        ]);

        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contractA->id,
            'amount' => 1_000_000,
            'meta' => ['note' => 'test A'],
        ]);
        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contractB->id,
            'amount' => 2_000_000,
            'meta' => ['note' => 'test B'],
        ]);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $all = $this->actingAs($owner)->getJson('/api/finance/refund-receipts?per_page=50');
        $all->assertOk();
        $this->assertSame(2, $all->json('meta.total'));

        $filtered = $this->actingAs($owner)->getJson('/api/finance/refund-receipts?per_page=50&filter[property_id]='.$propertyA->id);
        $filtered->assertOk();
        $this->assertSame(1, $filtered->json('meta.total'));
        $this->assertSame((string) $contractA->id, $filtered->json('data.0.contract_id'));
        $this->assertSame((string) $propertyA->id, $filtered->json('data.0.property_id'));
        $this->assertSame('P.101', $filtered->json('data.0.room_name'));
        $this->assertSame('REFUND_PENDING', $filtered->json('data.0.deposit_status'));
    }
}
