<?php

namespace Tests\Feature;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Events\Finance\InvoicePaidEvent;
use App\Jobs\Contract\ProcessContractTerminationJob;
use App\Models\Contract\Contract;
use App\Models\Contract\FinalPaymentRequest;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\LedgerEntry;
use App\Models\Handover\Handover;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ContractTerminationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Tenant']);
    }

    public function test_admin_can_terminate_contract_without_forfeiture()
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'created_by_user_id' => $admin->id,
        ]);

        $terminationDate = now()->format('Y-m-d');

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => $terminationDate,
                'cancellation_party' => 'MUTUAL',
                'reason' => 'Normal termination',
                'forfeit_deposit' => false,
            ]);

        $response->assertStatus(202)
            ->assertJsonPath('processing_mode', 'async_eda');

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertEquals(DepositStatus::REFUND_PENDING, $contract->deposit_status);
        $this->assertNotNull($contract->terminated_at);

        $room->refresh();
        $this->assertEquals('available', $room->status);

        // Verify termination invoice
        $invoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();

        $this->assertNotNull($invoice);
        $this->assertGreaterThan(0, (float) $invoice->total_amount);
    }

    public function test_admin_can_terminate_without_prior_handover_record(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $terminationDate = now()->format('Y-m-d');

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => $terminationDate,
                'cancellation_party' => 'MUTUAL',
                'reason' => 'Termination without manual handover step',
                'forfeit_deposit' => false,
            ])
            ->assertStatus(202)
            ->assertJsonPath('processing_mode', 'async_eda');

        $this->assertTrue(Handover::where('contract_id', $contract->id)->exists());

        $invoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();

        $this->assertNotNull($invoice);
    }

    public function test_admin_can_terminate_contract_with_deposit_forfeiture()
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'created_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => now()->format('Y-m-d'),
                'reason' => 'Early termination with forfeiture',
                'forfeit_deposit' => true,
            ])
            ->assertStatus(202)
            ->assertJsonPath('processing_mode', 'async_eda');

        $contract->refresh();
        $this->assertContains($contract->status, [ContractStatus::TERMINATED, ContractStatus::PENDING_SETTLEMENT, ContractStatus::CANCELLED], 'Unexpected contract status after EDA termination');

        // Verify termination invoice includes forfeiture if applicable
        $invoice = Invoice::where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->first();

        $this->assertNotNull($invoice);
    }

    public function test_second_terminate_while_processing_returns_409(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'created_by_user_id' => $admin->id,
        ]);

        $payload = [
            'termination_date' => now()->format('Y-m-d'),
            'cancellation_party' => 'MUTUAL',
            'reason' => 'Normal termination',
            'forfeit_deposit' => false,
        ];

        $lock = Cache::lock(ProcessContractTerminationJob::terminationLockName($contract->id), 120);
        $this->assertTrue($lock->get());
        try {
            $this->actingAs($admin)
                ->postJson("/api/contracts/{$contract->id}/terminate", $payload)
                ->assertStatus(409);
        } finally {
            $lock->release();
        }
    }

    public function test_invoice_paid_event_resolves_pending_settlement_to_terminated(): void
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::PENDING_SETTLEMENT,
        ]);

        $invoice = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->paid()
            ->create();

        FinalPaymentRequest::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'invoice_id' => $invoice->id,
            'amount_due' => '0.00',
            'status' => 'PENDING',
            'meta' => [],
        ]);

        InvoicePaidEvent::dispatch($invoice->fresh(), (string) Str::uuid());

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertNotNull($contract->terminated_at);

        $this->assertDatabaseHas('final_payment_requests', [
            'contract_id' => $contract->id,
            'status' => 'SATISFIED',
        ]);
    }

    public function test_issue_final_invoice_endpoint_returns_invoice_without_reconciling(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'combined',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.billing_mode', 'combined');

        $invoiceId = $response->json('data.invoice_id');
        $this->assertNotEmpty($invoiceId);

        $invoice = Invoice::find($invoiceId);
        $this->assertNotNull($invoice);
        $this->assertTrue((bool) $invoice->is_termination);

        // Reconcile chưa chạy → contract vẫn ACTIVE (không phải TERMINATED hay PENDING_SETTLEMENT)
        $contract->refresh();
        $this->assertNotEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertNotEquals(ContractStatus::PENDING_SETTLEMENT, $contract->status);
    }

    public function test_issue_final_invoice_merges_additional_invoice_lines(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'combined',
                'additional_invoice_lines' => [
                    ['description' => 'Khoản tay test', 'amount' => 11111],
                ],
            ]);

        $response->assertStatus(200);

        $invoice = Invoice::query()->with('items')->find($response->json('data.invoice_id'));
        $this->assertNotNull($invoice);
        $adjustments = $invoice->items->where('type', 'ADJUSTMENT');
        $this->assertTrue($adjustments->isNotEmpty());
        $this->assertTrue(
            $adjustments->contains(fn ($it) => str_contains((string) $it->description, 'Khoản tay test'))
        );
    }

    public function test_split_billing_mode_skips_rent_and_meter_lines(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        // Có sẵn HĐ định kỳ tháng đó (mô phỏng billing_mode=split — đã phát hành riêng).
        $periodStart = now()->startOfMonth()->toDateString();
        $periodEnd = now()->endOfMonth()->toDateString();
        Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'is_termination' => false,
                'total_amount' => 3000000,
            ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'damage_fee_total' => 200000,
                'billing_mode' => 'split',
            ]);

        $response->assertStatus(200);

        $items = $response->json('data.items');
        $types = collect($items)->pluck('type')->all();

        // Ở mode split: KHÔNG có dòng RENT, không có service tiền điện/nước.
        $this->assertNotContains('RENT', $types, 'Split mode must not include RENT line');

        // Phải có dòng PENALTY cho damage_fee_total.
        $this->assertContains('PENALTY', $types, 'Damage line must be present');

        // Tổng = 200000 (damage) (không cộng rent/service)
        $total = collect($items)->sum('amount');
        $this->assertEqualsWithDelta(200000.0, (float) $total, 1.0);
    }

    public function test_finalize_endpoint_after_issue_final_invoice_creates_refund_or_fpr(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        // Bước 5
        $issueResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'split',
                'damage_fee_total' => 100000,
            ]);
        $issueResp->assertStatus(200);

        // Bước 6
        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize");

        $finalizeResp->assertStatus(200);
        $scenario = $finalizeResp->json('data.scenario');
        $this->assertContains($scenario, ['A', 'B', 'C', 'FORFEIT'], "Unexpected scenario {$scenario}");

        if ($scenario === 'A') {
            $this->assertNotEmpty($finalizeResp->json('data.refund_receipt_id'));
        } elseif ($scenario === 'B') {
            $this->assertNotEmpty($finalizeResp->json('data.final_payment_request_id'));
        }
    }

    public function test_record_cash_payment_for_fpr_terminates_contract(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::TERMINATED,
            'terminated_at' => now()->subDay(),
            'deposit_amount' => 0,
            'deposit_status' => DepositStatus::FORFEITED,
        ]);

        // Hóa đơn quyết toán còn nợ 1.5 triệu
        $invoice = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'is_termination' => true,
                'total_amount' => 1500000,
                'paid_amount' => 0,
            ]);

        $fpr = FinalPaymentRequest::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'invoice_id' => $invoice->id,
            'amount_due' => '1500000.00',
            'status' => 'PENDING',
            'meta' => [],
        ]);

        $resp = $this->actingAs($admin)
            ->postJson("/api/final-payment-requests/{$fpr->id}/record-cash-payment", [
                'amount' => 1500000,
                'method' => 'CASH',
                'note' => 'Khách trả tiền mặt tại quầy.',
            ]);

        $resp->assertStatus(200);
        $this->assertTrue((bool) $resp->json('data.is_terminated'));

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);

        $this->assertDatabaseHas('final_payment_requests', [
            'id' => $fpr->id,
            'status' => 'SATISFIED',
        ]);
    }

    public function test_record_bank_transfer_for_fpr_requires_proof_and_stores_receipt(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::TERMINATED,
            'terminated_at' => now()->subDay(),
            'deposit_amount' => 0,
            'deposit_status' => DepositStatus::FORFEITED,
        ]);

        $invoice = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'is_termination' => true,
                'total_amount' => 1500000,
                'paid_amount' => 0,
            ]);

        $fpr = FinalPaymentRequest::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'invoice_id' => $invoice->id,
            'amount_due' => '1500000.00',
            'status' => 'PENDING',
            'meta' => [],
        ]);

        $this->actingAs($admin)
            ->postJson("/api/final-payment-requests/{$fpr->id}/record-cash-payment", [
                'amount' => 1500000,
                'method' => 'BANK_TRANSFER',
                'note' => 'CK',
            ])
            ->assertStatus(422);

        $ok = $this->actingAs($admin)
            ->post("/api/final-payment-requests/{$fpr->id}/record-cash-payment", [
                'amount' => 1500000,
                'method' => 'BANK_TRANSFER',
                'note' => 'CK',
                'proof_image' => UploadedFile::fake()->image('proof.jpg', 400, 400),
            ]);
        $ok->assertOk()
            ->assertJsonPath('data.proof_receipt.kind', 'PROOF');
        $this->assertNotEmpty($ok->json('data.proof_receipt.url'));

        $this->assertDatabaseHas('receipts', [
            'org_id' => $org->id,
            'kind' => 'PROOF',
        ]);
    }

    public function test_liquidation_preview_flags_early_termination_by_dates_not_clock(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $scheduledEnd = now()->addMonths(6)->format('Y-m-d');
        $terminationOnLastDay = Carbon::parse($scheduledEnd)->format('Y-m-d');

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
            'end_date' => $scheduledEnd,
        ]);

        $query = http_build_query([
            'termination_date' => $terminationOnLastDay,
            'cancellation_party' => 'TENANT',
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/contracts/{$contract->id}/termination/liquidation-preview?{$query}");

        $response->assertOk()
            ->assertJsonPath('data.is_early_termination', false);
    }

    public function test_liquidation_preview_mid_month_credit_applies_when_periodic_invoice_exists(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $terminationDate = now()->format('Y-m-d');
        $periodStart = now()->startOfMonth()->toDateString();
        $periodEnd = now()->endOfMonth()->toDateString();

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
            'end_date' => now()->addMonths(3)->format('Y-m-d'),
        ]);

        Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'is_termination' => false,
                'total_amount' => 3000000,
            ]);

        $query = http_build_query([
            'termination_date' => $terminationDate,
            'billing_mode' => 'combined',
            'mid_month_rent_credit' => 500000,
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/contracts/{$contract->id}/termination/liquidation-preview?{$query}");

        $response->assertOk();
        $items = $response->json('data.items');
        $discountTotal = collect($items)->where('type', 'DISCOUNT')->sum('amount');
        $this->assertEquals(-500000.0, (float) $discountTotal);
    }

    public function test_finalize_refund_receipt_lines_stored_on_refund_receipt(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
            'end_date' => now()->addYear()->format('Y-m-d'),
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'combined',
                'damage_fee_total' => 0,
            ])
            ->assertStatus(200);

        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize", [
                'refund_receipt_lines' => [
                    ['description' => 'Hoàn thỏa thuận', 'amount' => 250000],
                ],
            ]);

        $finalizeResp->assertStatus(200);
        $refundId = $finalizeResp->json('data.refund_receipt_id');
        $this->assertNotEmpty($refundId);

        $refund = RefundReceipt::findOrFail($refundId);
        $lines = $refund->meta['refund_receipt_lines'] ?? [];
        $this->assertNotEmpty($lines);
        $this->assertSame(250000.0, (float) $refund->amount);
    }

    public function test_finalize_rejects_refund_lines_over_deposit_remaining(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
            'end_date' => now()->addYear()->format('Y-m-d'),
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'combined',
                'damage_fee_total' => 100000,
            ])
            ->assertStatus(200);

        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize", [
                'refund_receipt_lines' => [
                    ['description' => 'Quá mức cọc còn lại', 'amount' => 6000000],
                ],
            ]);

        $finalizeResp->assertStatus(422);
    }

    public function test_post_terminate_accepts_billing_mode_split(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
            'end_date' => now()->addMonths(3)->format('Y-m-d'),
        ]);

        Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'created_by_user_id' => $admin->id,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'split',
            ]);

        $response->assertStatus(202);

        $contract->refresh();
        $this->assertSame(
            'split',
            $contract->meta['termination_details']['billing_mode'] ?? null
        );
    }

    public function test_link_final_invoice_marks_invoice_and_finalize_succeeds(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $billingInvoice = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'is_termination' => false,
                'total_amount' => 150000,
            ]);

        $linkResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/link-final-invoice", [
                'invoice_id' => $billingInvoice->id,
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'combined',
            ]);

        $linkResp->assertStatus(200)
            ->assertJsonPath('data.linked_from_billing', true);

        $billingInvoice->refresh();
        $this->assertTrue((bool) $billingInvoice->is_termination);
        $this->assertEqualsWithDelta(150000.0, (float) $billingInvoice->total_amount, 0.01);

        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize");

        $finalizeResp->assertStatus(200);
        $this->assertContains($finalizeResp->json('data.scenario'), ['A', 'B', 'C']);

        $getLinked = $this->actingAs($admin)
            ->getJson("/api/contracts/{$contract->id}/termination/linked-final-invoice");

        $getLinked->assertOk()
            ->assertJsonPath('data.invoice_id', $billingInvoice->id)
            ->assertJsonPath('data.linked_from_billing', true);
    }

    public function test_termination_linked_final_invoice_get_returns_null_when_none(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $this->actingAs($admin)
            ->getJson("/api/contracts/{$contract->id}/termination/linked-final-invoice")
            ->assertOk()
            ->assertJsonPath('data', null);
    }

    public function test_link_final_invoice_rejects_second_different_invoice(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $invA = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'is_termination' => false,
                'total_amount' => 100000,
                'period_start' => now()->subMonths(1)->startOfMonth()->toDateString(),
                'period_end' => now()->subMonths(1)->endOfMonth()->toDateString(),
            ]);

        $invB = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->issued()
            ->create([
                'is_termination' => false,
                'total_amount' => 200000,
                'period_start' => now()->subMonths(2)->startOfMonth()->toDateString(),
                'period_end' => now()->subMonths(2)->endOfMonth()->toDateString(),
            ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/link-final-invoice", [
                'invoice_id' => $invA->id,
                'termination_date' => now()->format('Y-m-d'),
                'billing_mode' => 'combined',
            ])
            ->assertStatus(200);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/link-final-invoice", [
                'invoice_id' => $invB->id,
                'termination_date' => now()->format('Y-m-d'),
                'billing_mode' => 'combined',
            ])
            ->assertStatus(422);
    }

    public function test_link_final_invoice_rejects_non_issued_invoice(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3000000,
        ]);

        $draft = Invoice::factory()
            ->for($org, 'org')
            ->for($property, 'property')
            ->for($contract, 'contract')
            ->for($room, 'room')
            ->create([
                'is_termination' => false,
                'status' => 'DRAFT',
                'total_amount' => 50000,
            ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/link-final-invoice", [
                'invoice_id' => $draft->id,
                'termination_date' => now()->format('Y-m-d'),
                'billing_mode' => 'combined',
            ])
            ->assertStatus(422);
    }

    public function test_finalize_scenario_b_with_org_supplemental_flag_creates_supplemental_invoice_and_fpr(): void
    {
        $org = Org::factory()->create([
            'settings' => [
                'termination_require_supplemental_invoice_for_outstanding' => true,
            ],
        ]);
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 1_000_000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3_000_000,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'split',
                'damage_fee_total' => 3_000_000,
            ])
            ->assertStatus(200);

        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize");

        $finalizeResp->assertStatus(200);
        $this->assertSame('B', $finalizeResp->json('data.scenario'));

        $suppId = $finalizeResp->json('data.supplemental_invoice_id');
        $this->assertNotEmpty($suppId);

        $fprId = $finalizeResp->json('data.final_payment_request_id');
        $fpr = FinalPaymentRequest::findOrFail($fprId);
        $this->assertSame($suppId, $fpr->invoice_id);
        $this->assertSame($finalizeResp->json('data.final_invoice_id'), $fpr->meta['termination_invoice_id'] ?? null);

        $termInv = Invoice::query()
            ->where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->orderByDesc('created_at')
            ->first();
        $this->assertNotNull($termInv);
        $outstanding = round(max(0, (float) $termInv->total_amount - (float) $termInv->paid_amount), 2);
        $this->assertLessThanOrEqual(0.02, $outstanding);

        $suppInv = Invoice::findOrFail($suppId);
        $this->assertFalse((bool) $suppInv->is_termination);
        $this->assertEqualsWithDelta(2_000_000.0, (float) $suppInv->total_amount, 1.0);

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertNotNull($contract->terminated_at);
        $this->assertSame(ContractStatus::TERMINATED->value, $finalizeResp->json('data.contract_status'));
        $room->refresh();
        $this->assertSame('available', $room->status);
    }

    public function test_finalize_scenario_b_without_org_flag_keeps_fpr_on_termination_invoice(): void
    {
        $org = Org::factory()->create([
            'settings' => [
                'termination_require_supplemental_invoice_for_outstanding' => false,
            ],
        ]);
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 1_000_000,
            'deposit_status' => DepositStatus::HELD,
            'rent_price' => 3_000_000,
        ]);

        $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'split',
                'damage_fee_total' => 3_000_000,
            ])
            ->assertStatus(200);

        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize");

        $finalizeResp->assertStatus(200);
        $this->assertSame('B', $finalizeResp->json('data.scenario'));
        $this->assertNull($finalizeResp->json('data.supplemental_invoice_id'));

        $fpr = FinalPaymentRequest::findOrFail($finalizeResp->json('data.final_payment_request_id'));
        $this->assertSame($finalizeResp->json('data.final_invoice_id'), $fpr->invoice_id);

        $contract->refresh();
        $this->assertEquals(ContractStatus::TERMINATED, $contract->status);
        $this->assertSame(ContractStatus::TERMINATED->value, $finalizeResp->json('data.contract_status'));
        $room->refresh();
        $this->assertSame('available', $room->status);
    }

    public function test_finalize_forfeit_remaining_deposit_suppresses_refund_receipt(): void
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => ContractStatus::ACTIVE,
            'deposit_amount' => 5000000,
            'deposit_status' => DepositStatus::HELD,
            'forfeited_amount' => 0,
            'rent_price' => 3000000,
        ]);

        $issueResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/issue-final-invoice", [
                'termination_date' => now()->format('Y-m-d'),
                'cancellation_party' => 'MUTUAL',
                'billing_mode' => 'split',
                'damage_fee_total' => 100000,
            ]);
        $issueResp->assertStatus(200);

        $finalizeResp = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/terminate/finalize", [
                'forfeit_remaining_deposit' => true,
            ]);

        $finalizeResp->assertStatus(200);
        $this->assertSame('FORFEIT', $finalizeResp->json('data.scenario'));
        $this->assertNull($finalizeResp->json('data.refund_receipt_id'));
        $this->assertSame(0.0, (float) $finalizeResp->json('data.refund_amount'));
        $this->assertGreaterThan(1000.0, (float) $finalizeResp->json('data.forfeited_amount'));

        $contract->refresh();
        $this->assertEquals(DepositStatus::FORFEITED, $contract->deposit_status);
        $this->assertGreaterThan(0, (float) $contract->forfeited_amount);

        $this->assertSame(0, RefundReceipt::query()->where('contract_id', $contract->id)->count());

        $this->assertTrue(
            LedgerEntry::query()
                ->where('org_id', $org->id)
                ->where('ref_type', LedgerEntry::REF_TYPE_TERMINATION_DEPOSIT_FORFEIT)
                ->where('meta->contract_id', $contract->id)
                ->exists(),
            'Expected ledger row for deposit forfeit book recognition.',
        );
    }
}
