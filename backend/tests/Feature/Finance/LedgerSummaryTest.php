<?php

namespace Tests\Feature\Finance;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
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

class LedgerSummaryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
    }

    public function test_ledger_summary_returns_collected_refunded_and_deposit_held(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $floor = Floor::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'floor_id' => $floor->id,
        ]);

        $paymentIdA = (string) Str::uuid();
        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => $paymentIdA,
            'debit' => 1_000_000,
            'credit' => 0,
            'occurred_at' => now(),
            'meta' => [
                'account' => LedgerEntry::ACCOUNT_CASH_BANK,
                'property_id' => $property->id,
            ],
        ]);

        $paymentIdB = (string) Str::uuid();
        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment_reversal',
            'ref_id' => $paymentIdB,
            'debit' => 0,
            'credit' => 200_000,
            'occurred_at' => now(),
            'meta' => [
                'account' => LedgerEntry::ACCOUNT_CASH_BANK,
                'property_id' => $property->id,
            ],
        ]);

        Contract::factory()->create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_status' => DepositStatus::HELD,
            'deposit_amount' => 5_000_000,
            'refunded_amount' => 0,
        ]);

        // HĐ đã kết thúc + cọc đã hoàn → KHÔNG còn nằm trong total_deposit_held theo semantic mới
        // (Sổ cái 5 tab: tổng cọc của hợp đồng ACTIVE).
        Contract::factory()->create([
            'org_id' => $org->id,
            'room_id' => $room->id,
            'status' => ContractStatus::TERMINATED,
            'deposit_status' => DepositStatus::REFUNDED,
            'deposit_amount' => 3_000_000,
            'refunded_amount' => 3_000_000,
        ]);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->getJson('/api/finance/ledger/summary');

        $response->assertOk();
        $data = $response->json('data');
        $this->assertSame(1_000_000.0, (float) $data['total_collected']);
        // total_refunded đổi semantic: chỉ tính RefundReceipt đã chi (paid_at != null) — chưa có phiếu nào → 0.
        $this->assertSame(0.0, (float) $data['total_refunded']);
        // Giá trị void Payment cũ nay nằm ở `total_payment_reversal`.
        $this->assertSame(200_000.0, (float) $data['total_payment_reversal']);
        // Chỉ còn HĐ ACTIVE (5tr); HĐ TERMINATED không cộng vào.
        $this->assertSame(5_000_000.0, (float) $data['total_deposit_held']);
    }

    public function test_ledger_summary_respects_property_filter(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $propertyA = Property::factory()->create(['org_id' => $org->id]);
        $propertyB = Property::factory()->create(['org_id' => $org->id]);

        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => (string) Str::uuid(),
            'debit' => 100,
            'credit' => 0,
            'occurred_at' => now(),
            'meta' => ['account' => LedgerEntry::ACCOUNT_CASH_BANK, 'property_id' => $propertyA->id],
        ]);

        LedgerEntry::create([
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => (string) Str::uuid(),
            'debit' => 900,
            'credit' => 0,
            'occurred_at' => now(),
            'meta' => ['account' => LedgerEntry::ACCOUNT_CASH_BANK, 'property_id' => $propertyB->id],
        ]);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $response = $this->actingAs($owner)->getJson('/api/finance/ledger/summary?filter[property_id]='.$propertyA->id);

        $response->assertOk();
        $this->assertSame(100.0, (float) $response->json('data.total_collected'));
    }
}
