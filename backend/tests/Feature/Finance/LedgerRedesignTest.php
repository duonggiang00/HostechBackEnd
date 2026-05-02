<?php

namespace Tests\Feature\Finance;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\Payment;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\TenantManager;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Tests cho redesign Sổ cái 5 tab:
 * - GET /finance/cashflow-feed (UNION Payment IN + RefundReceipt OUT)
 * - GET /finance/ledger/summary (đổi semantic total_refunded + total_deposit_held)
 * - GET /finance/refund-receipts?filter[paid_only]=1
 * - GET /properties/{id}/invoices?filter[has_outstanding]=1
 */
class LedgerRedesignTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
    }

    private function setupOrgScope(): array
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        return [$org, $owner, $property, $room];
    }

    public function test_cashflow_feed_lists_in_and_out_sorted_desc(): void
    {
        [$org, $owner, $property, $room] = $this->setupOrgScope();

        $payer = User::factory()->create(['org_id' => $org->id]);
        $payer->assignRole('Tenant');

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'deposit_amount' => 5_000_000,
            'deposit_status' => DepositStatus::REFUND_PENDING,
        ]);

        $payment = Payment::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $property->id,
            'payer_user_id' => $payer->id,
            'received_by_user_id' => $owner->id,
            'method' => 'CASH',
            'amount' => 1_500_000,
            'reference' => 'PAY-001',
            'status' => 'APPROVED',
            'received_at' => now()->subDays(2),
        ]);

        $refundPaid = RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 800_000,
            'reference' => 'REF-001',
            'paid_at' => now()->subDay(),
            'paid_by_user_id' => $owner->id,
            'payout_method' => 'TRANSFER',
        ]);

        // Phiếu hoàn cọc CHƯA chi → không xuất hiện trong feed
        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 200_000,
        ]);

        $response = $this->actingAs($owner)->getJson('/api/finance/cashflow-feed?per_page=20');

        $response->assertOk();
        $rows = $response->json('data');
        $this->assertCount(2, $rows);

        // Sort desc theo occurred_at: refund (yesterday) trước payment (2 ngày trước)
        $this->assertSame((string) $refundPaid->id, $rows[0]['id']);
        $this->assertSame('OUT', $rows[0]['direction']);
        $this->assertSame('refund_receipt', $rows[0]['kind']);
        $this->assertSame(800000.0, (float) $rows[0]['amount']);

        $this->assertSame((string) $payment->id, $rows[1]['id']);
        $this->assertSame('IN', $rows[1]['direction']);
        $this->assertSame('payment', $rows[1]['kind']);
        $this->assertSame(1500000.0, (float) $rows[1]['amount']);
    }

    public function test_cashflow_feed_filters_by_property_and_direction(): void
    {
        [$org, $owner, $propertyA] = $this->setupOrgScope();
        $propertyB = Property::factory()->create(['org_id' => $org->id]);
        $roomB = Room::factory()->create(['org_id' => $org->id, 'property_id' => $propertyB->id]);

        Payment::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $propertyA->id,
            'payer_user_id' => $owner->id,
            'received_by_user_id' => $owner->id,
            'method' => 'CASH',
            'amount' => 1_000_000,
            'status' => 'APPROVED',
            'received_at' => now(),
        ]);
        Payment::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $propertyB->id,
            'payer_user_id' => $owner->id,
            'received_by_user_id' => $owner->id,
            'method' => 'CASH',
            'amount' => 2_000_000,
            'status' => 'APPROVED',
            'received_at' => now(),
        ]);

        $contractB = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $propertyB->id,
            'room_id' => $roomB->id,
        ]);
        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contractB->id,
            'amount' => 500_000,
            'paid_at' => now(),
            'paid_by_user_id' => $owner->id,
            'payout_method' => 'CASH',
        ]);

        // Lọc theo property A: chỉ payment 1.000.000
        $a = $this->actingAs($owner)->getJson("/api/finance/cashflow-feed?filter[property_id]={$propertyA->id}");
        $a->assertOk();
        $this->assertCount(1, $a->json('data'));
        $this->assertSame(1000000.0, (float) $a->json('data.0.amount'));

        // Lọc property B: 1 payment + 1 refund = 2 dòng
        $b = $this->actingAs($owner)->getJson("/api/finance/cashflow-feed?filter[property_id]={$propertyB->id}");
        $b->assertOk();
        $this->assertCount(2, $b->json('data'));

        // Lọc property B + direction=OUT: chỉ 1 refund
        $bOut = $this->actingAs($owner)->getJson("/api/finance/cashflow-feed?filter[property_id]={$propertyB->id}&filter[direction]=OUT");
        $bOut->assertOk();
        $this->assertCount(1, $bOut->json('data'));
        $this->assertSame('OUT', $bOut->json('data.0.direction'));
    }

    public function test_summary_total_refunded_equals_sum_of_paid_refund_receipts(): void
    {
        [$org, $owner, $property, $room] = $this->setupOrgScope();

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
        ]);

        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 1_200_000,
            'paid_at' => now(),
            'paid_by_user_id' => $owner->id,
            'payout_method' => 'TRANSFER',
        ]);
        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 800_000,
            'paid_at' => now(),
            'paid_by_user_id' => $owner->id,
            'payout_method' => 'CASH',
        ]);
        // Phiếu chưa chi → KHÔNG cộng vào total_refunded
        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 999_999,
        ]);

        $r = $this->actingAs($owner)->getJson('/api/finance/ledger/summary');
        $r->assertOk();
        $this->assertSame(2_000_000.0, (float) $r->json('data.total_refunded'));
        $this->assertArrayHasKey('total_payment_reversal', $r->json('data'));
    }

    public function test_summary_total_deposit_held_only_counts_active_contracts(): void
    {
        [$org, $owner, $property, $room1] = $this->setupOrgScope();
        $room2 = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $room3 = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        Contract::factory()->create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room1->id,
            'status' => ContractStatus::ACTIVE->value,
            'deposit_amount' => 5_000_000,
            'deposit_status' => DepositStatus::HELD,
        ]);
        Contract::factory()->create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room2->id,
            'status' => ContractStatus::ACTIVE->value,
            'deposit_amount' => 3_000_000,
            'deposit_status' => DepositStatus::HELD,
        ]);
        // HĐ TERMINATED → KHÔNG còn trong sum
        Contract::factory()->create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room3->id,
            'status' => ContractStatus::TERMINATED->value,
            'deposit_amount' => 9_000_000,
            'deposit_status' => DepositStatus::REFUNDED,
        ]);

        $r = $this->actingAs($owner)->getJson('/api/finance/ledger/summary');
        $r->assertOk();
        $this->assertSame(8_000_000.0, (float) $r->json('data.total_deposit_held'));
    }

    public function test_refund_receipts_paid_only_filter_excludes_unpaid(): void
    {
        [$org, $owner, $property, $room] = $this->setupOrgScope();

        $contract = Contract::factory()->create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
        ]);

        RefundReceipt::create([
            'org_id' => $org->id, 'contract_id' => $contract->id,
            'amount' => 1_000_000,
            'paid_at' => now(),
            'paid_by_user_id' => $owner->id,
            'payout_method' => 'CASH',
        ]);
        RefundReceipt::create([
            'org_id' => $org->id, 'contract_id' => $contract->id,
            'amount' => 500_000,
        ]);

        // Không filter → 2 phiếu
        $all = $this->actingAs($owner)->getJson('/api/finance/refund-receipts');
        $all->assertOk();
        $this->assertSame(2, $all->json('meta.total'));

        // paid_only=1 → 1 phiếu
        $paid = $this->actingAs($owner)->getJson('/api/finance/refund-receipts?filter[paid_only]=1');
        $paid->assertOk();
        $this->assertSame(1, $paid->json('meta.total'));
        $this->assertNotNull($paid->json('data.0.paid_at'));
    }

    public function test_refund_receipt_resource_includes_tenant_name(): void
    {
        [$org, $owner, $property, $room] = $this->setupOrgScope();

        $tenantUser = User::factory()->create(['org_id' => $org->id, 'full_name' => 'Nguyễn Văn Test']);
        $tenantUser->assignRole('Tenant');

        $contract = Contract::factory()->create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
        ]);
        ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenantUser->id,
            'full_name' => $tenantUser->full_name,
            'role' => 'PRIMARY',
            'status' => 'APPROVED',
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        RefundReceipt::create([
            'org_id' => $org->id, 'contract_id' => $contract->id,
            'amount' => 1_000_000,
            'paid_at' => now(),
            'paid_by_user_id' => $owner->id,
            'payout_method' => 'CASH',
        ]);

        $r = $this->actingAs($owner)->getJson('/api/finance/refund-receipts?filter[paid_only]=1');
        $r->assertOk();
        $this->assertSame('Nguyễn Văn Test', $r->json('data.0.tenant_name'));
    }

    public function test_invoice_has_outstanding_filter_excludes_paid_invoices(): void
    {
        [$org, $owner, $property, $room] = $this->setupOrgScope();

        $contract = Contract::factory()->create([
            'org_id' => $org->id, 'property_id' => $property->id, 'room_id' => $room->id,
        ]);

        // Hóa đơn còn nợ
        Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => 'ISSUED',
            'issue_date' => now(),
            'due_date' => now()->addDays(7),
            'period_start' => now()->startOfMonth(),
            'period_end' => now()->endOfMonth(),
            'total_amount' => 2_000_000,
            'paid_amount' => 500_000,
        ]);
        // Hóa đơn đã PAID → không xuất hiện
        Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => 'PAID',
            'issue_date' => now(),
            'due_date' => now()->addDays(7),
            'period_start' => now()->subMonth()->startOfMonth(),
            'period_end' => now()->subMonth()->endOfMonth(),
            'total_amount' => 1_500_000,
            'paid_amount' => 1_500_000,
        ]);
        // Hóa đơn CANCELLED → không xuất hiện dù còn balance
        Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => 'CANCELLED',
            'issue_date' => now(),
            'due_date' => now()->addDays(7),
            'period_start' => now()->subMonths(2)->startOfMonth(),
            'period_end' => now()->subMonths(2)->endOfMonth(),
            'total_amount' => 1_000_000,
            'paid_amount' => 0,
        ]);

        $r = $this->actingAs($owner)->getJson("/api/properties/{$property->id}/invoices?filter[has_outstanding]=1");
        $r->assertOk();
        $this->assertSame(1, $r->json('meta.total'));
        $this->assertSame(1_500_000.0, (float) $r->json('data.0.debt'));
    }
}
