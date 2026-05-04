<?php

namespace Tests\Feature\Finance;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\LedgerEntry;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Contract\Termination\TerminationReconciliationService;
use App\Services\TenantManager;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Kiểm tra luồng quyết toán thanh lý HĐ:
 * 1. reconcile() tạo LedgerEntry CASH_BANK (debit) → tiền cọc xuất hiện trong dòng tiền quỹ.
 * 2. cashflow-feed trả về dòng deposit_settlement.
 * 3. RefundReceipt được tạo (kịch bản A) + PDF được sinh.
 */
class TerminationDepositLedgerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
    }

    private function buildContract(int $deposit = 5_000_000, string $status = ContractStatus::ACTIVE->value): array
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => $status,
            'deposit_amount' => $deposit,
            'deposit_status' => DepositStatus::HELD,
            'start_date' => now()->subMonths(3)->toDateString(),
            'end_date' => now()->addMonths(9)->toDateString(),
        ]);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        return compact('org', 'property', 'room', 'contract', 'owner');
    }

    private function makeInvoice(array $ctx, float $amount, bool $termination = false): Invoice
    {
        return Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $ctx['org']->id,
            'property_id' => $ctx['property']->id,
            'room_id' => $ctx['room']->id,
            'contract_id' => $ctx['contract']->id,
            'status' => 'ISSUED',
            'total_amount' => $amount,
            'paid_amount' => 0,
            'is_termination' => $termination,
            'due_date' => now()->subDay()->toDateString(),
            'period_start' => now()->subMonth()->startOfMonth()->toDateString(),
            'period_end' => now()->subMonth()->endOfMonth()->toDateString(),
        ]);
    }

    // ── Test 1: reconcile kịch bản A (cọc > hóa đơn) ─────────────────────────

    public function test_reconcile_scenario_a_creates_cash_bank_debit_ledger_entry(): void
    {
        // Cọc 5 triệu, HĐ thanh lý 3 triệu → dư 2 triệu → kịch bản A
        $ctx = $this->buildContract(5_000_000);
        $ctx['contract']->update(['status' => ContractStatus::PENDING_TERMINATION]);

        $finalInvoice = $this->makeInvoice($ctx, 3_000_000, true);

        /** @var TerminationReconciliationService $service */
        $service = app(TerminationReconciliationService::class);
        $result = $service->reconcile($ctx['contract']->fresh(), $finalInvoice->fresh());

        $this->assertEquals('A', $result['scenario']);

        // Phải có ít nhất 1 LedgerEntry CASH_BANK debit cho termination_deposit_allocation
        $cashBankDebit = LedgerEntry::where('org_id', $ctx['org']->id)
            ->where('ref_type', 'termination_deposit_allocation')
            ->where('meta->account', LedgerEntry::ACCOUNT_CASH_BANK)
            ->where('debit', '>', 0)
            ->get();

        // Chỉ phần cọc được cấn trừ vào hóa đơn (3M) tạo ledger; 2M còn lại → RefundReceipt.
        $this->assertGreaterThan(0, $cashBankDebit->count(), 'Phải có LedgerEntry CASH_BANK debit khi cấn trừ cọc.');
        $this->assertEquals(3_000_000, $cashBankDebit->sum('debit'), 'Tổng debit phải bằng phần cọc cấn trừ vào hóa đơn.');
    }

    public function test_reconcile_scenario_a_creates_refund_receipt_with_pdf(): void
    {
        // Storage::fake đã được config, ReceiptService sẽ lưu file
        $ctx = $this->buildContract(5_000_000);
        $ctx['contract']->update(['status' => ContractStatus::PENDING_TERMINATION]);

        $finalInvoice = $this->makeInvoice($ctx, 3_000_000, true);

        /** @var TerminationReconciliationService $service */
        $service = app(TerminationReconciliationService::class);
        $result = $service->reconcile($ctx['contract']->fresh(), $finalInvoice->fresh());

        $this->assertEquals('A', $result['scenario']);
        $this->assertNotNull($result['refund_receipt_id']);

        // RefundReceipt phải tồn tại
        $receipt = RefundReceipt::find($result['refund_receipt_id']);
        $this->assertNotNull($receipt);
        $this->assertEquals(2_000_000, (float) $receipt->amount);

        // PDF phải được sinh ngay (pdf_path không null)
        $this->assertNotNull($receipt->pdf_path, 'PDF hoàn cọc phải được sinh ngay sau quyết toán.');
    }

    public function test_reconcile_scenario_c_creates_cash_bank_debit_for_full_deposit_offset(): void
    {
        // Cọc 3 triệu, HĐ thanh lý đúng 3 triệu → kịch bản C (không còn dư)
        $ctx = $this->buildContract(3_000_000);
        $ctx['contract']->update(['status' => ContractStatus::PENDING_TERMINATION]);

        $finalInvoice = $this->makeInvoice($ctx, 3_000_000, true);

        /** @var TerminationReconciliationService $service */
        $service = app(TerminationReconciliationService::class);
        $result = $service->reconcile($ctx['contract']->fresh(), $finalInvoice->fresh());

        $this->assertEquals('C', $result['scenario']);

        $cashBankDebit = LedgerEntry::where('org_id', $ctx['org']->id)
            ->where('ref_type', 'termination_deposit_allocation')
            ->where('meta->account', LedgerEntry::ACCOUNT_CASH_BANK)
            ->where('debit', '>', 0)
            ->sum('debit');

        $this->assertEquals(3_000_000, $cashBankDebit);
    }

    public function test_cashflow_feed_includes_deposit_settlement_as_in(): void
    {
        $ctx = $this->buildContract(4_000_000);
        $ctx['contract']->update(['status' => ContractStatus::PENDING_TERMINATION]);

        $finalInvoice = $this->makeInvoice($ctx, 2_000_000, true);

        /** @var TerminationReconciliationService $service */
        $service = app(TerminationReconciliationService::class);
        $service->reconcile($ctx['contract']->fresh(), $finalInvoice->fresh());

        // Gọi cashflow-feed API
        $response = $this->actingAs($ctx['owner'])
            ->getJson('/api/finance/cashflow-feed?per_page=50');

        $response->assertOk();

        $items = collect($response->json('data'));
        $depositItems = $items->where('kind', 'deposit_settlement')->where('direction', 'IN');

        // 4M deposit, 2M final invoice → 2M cấn trừ (IN), 2M hoàn (tạo RefundReceipt).
        $this->assertGreaterThan(0, $depositItems->count(), 'Cashflow feed phải có dòng deposit_settlement IN.');
        $this->assertEquals(2_000_000, $depositItems->sum('amount'), 'Tổng deposit_settlement phải bằng phần cọc cấn trừ vào hóa đơn.');
    }

    public function test_reconcile_with_old_outstanding_invoice_creates_ledger_per_invoice(): void
    {
        // Cọc 6 triệu, 2 HĐ cũ chưa trả (1tr + 1tr), HĐ thanh lý 2 triệu → cấn trừ 4 tr.
        $ctx = $this->buildContract(6_000_000);
        $ctx['contract']->update(['status' => ContractStatus::PENDING_TERMINATION]);

        // Tạo 2 hóa đơn cũ ở các kỳ khác nhau để tránh unique constraint.
        $oldInvoice1 = Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $ctx['org']->id,
            'property_id' => $ctx['property']->id,
            'room_id' => $ctx['room']->id,
            'contract_id' => $ctx['contract']->id,
            'status' => 'ISSUED',
            'total_amount' => 1_000_000,
            'paid_amount' => 0,
            'is_termination' => false,
            'due_date' => now()->subDays(60)->toDateString(),
            'period_start' => now()->subMonths(3)->startOfMonth()->toDateString(),
            'period_end' => now()->subMonths(3)->endOfMonth()->toDateString(),
        ]);
        $oldInvoice2 = Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $ctx['org']->id,
            'property_id' => $ctx['property']->id,
            'room_id' => $ctx['room']->id,
            'contract_id' => $ctx['contract']->id,
            'status' => 'ISSUED',
            'total_amount' => 1_000_000,
            'paid_amount' => 0,
            'is_termination' => false,
            'due_date' => now()->subDays(30)->toDateString(),
            'period_start' => now()->subMonths(2)->startOfMonth()->toDateString(),
            'period_end' => now()->subMonths(2)->endOfMonth()->toDateString(),
        ]);
        $finalInvoice = $this->makeInvoice($ctx, 2_000_000, true);

        /** @var TerminationReconciliationService $service */
        $service = app(TerminationReconciliationService::class);
        $result = $service->reconcile($ctx['contract']->fresh(), $finalInvoice->fresh());

        $this->assertEquals('A', $result['scenario']);

        $totalCashBankDebit = LedgerEntry::where('org_id', $ctx['org']->id)
            ->where('ref_type', 'termination_deposit_allocation')
            ->where('meta->account', LedgerEntry::ACCOUNT_CASH_BANK)
            ->sum('debit');

        // 1tr (hóa đơn 1) + 1tr (hóa đơn 2) + 2tr (hóa đơn thanh lý) = 4tr cấn trừ, 2tr hoàn
        $this->assertEquals(4_000_000, $totalCashBankDebit);

        // Số dòng LedgerEntry CASH_BANK = 3 (mỗi invoice 1 dòng)
        $countRows = LedgerEntry::where('org_id', $ctx['org']->id)
            ->where('ref_type', 'termination_deposit_allocation')
            ->where('meta->account', LedgerEntry::ACCOUNT_CASH_BANK)
            ->count();

        $this->assertEquals(3, $countRows);
    }
}
