<?php

namespace Tests\Feature\Contract;

use App\Enums\ContractStatus;
use App\Events\Contract\ContractSignatureConfirmed;
use App\Events\Contract\Termination\DebtReconciliationTriggered;
use App\Events\Contract\Termination\FinalInvoiceGenerated;
use App\Events\Contract\Termination\HandoverSubmitted;
use App\Events\Contract\Termination\SettlementPaymentRequired;
use App\Events\Contract\Termination\SettlementResolved;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Contract\ContractStatusHistory;
use App\Models\Contract\FinalPaymentRequest;
use App\Models\Handover\Handover;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ContractTimelineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->artisan('rbac:sync');
        Role::firstOrCreate(['name' => 'Admin']);
        Role::firstOrCreate(['name' => 'Tenant']);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /**
     * @return array{Org, Property, Room, Contract}
     */
    private function setupContract(string $status = 'DRAFT'): array
    {
        $org = Org::factory()->create();
        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'status' => $status,
            'rent_price' => 5_000_000,
            'deposit_amount' => 5_000_000,
        ]);

        return [$org, $property, $room, $contract];
    }

    public function test_creating_contract_records_contract_created_milestone(): void
    {
        [$org, , , $contract] = $this->setupContract('DRAFT');

        $this->assertDatabaseHas('contract_status_histories', [
            'contract_id' => $contract->id,
            'event_type' => ContractStatusHistory::EVENT_CONTRACT_CREATED,
            'to_status' => 'DRAFT',
        ]);
    }

    public function test_status_change_records_status_change_row_with_correct_columns(): void
    {
        [, , , $contract] = $this->setupContract('DRAFT');

        $contract->update(['status' => 'PENDING_SIGNATURE']);

        $row = ContractStatusHistory::query()
            ->where('contract_id', $contract->id)
            ->where('event_type', ContractStatusHistory::EVENT_STATUS_CHANGE)
            ->orderByDesc('created_at')
            ->first();

        $this->assertNotNull($row);
        $this->assertSame('DRAFT', $row->from_status);
        $this->assertSame('PENDING_SIGNATURE', $row->to_status);
        $this->assertNotEmpty($row->notes);
    }

    public function test_signature_event_writes_signature_milestone(): void
    {
        [, , , $contract] = $this->setupContract('PENDING_SIGNATURE');

        event(new ContractSignatureConfirmed($contract, 'tenant'));
        event(new ContractSignatureConfirmed($contract, 'manager'));

        $this->assertDatabaseHas('contract_status_histories', [
            'contract_id' => $contract->id,
            'event_type' => ContractStatusHistory::EVENT_SIGNATURE_TENANT,
        ]);

        $this->assertDatabaseHas('contract_status_histories', [
            'contract_id' => $contract->id,
            'event_type' => ContractStatusHistory::EVENT_SIGNATURE_MANAGER,
        ]);
    }

    public function test_signature_event_is_idempotent_within_dedupe_window(): void
    {
        [, , , $contract] = $this->setupContract('PENDING_SIGNATURE');

        event(new ContractSignatureConfirmed($contract, 'tenant'));
        event(new ContractSignatureConfirmed($contract, 'tenant'));
        event(new ContractSignatureConfirmed($contract, 'tenant'));

        $count = ContractStatusHistory::query()
            ->where('contract_id', $contract->id)
            ->where('event_type', ContractStatusHistory::EVENT_SIGNATURE_TENANT)
            ->count();

        $this->assertSame(1, $count);
    }

    public function test_handover_submitted_event_writes_milestone_with_payload(): void
    {
        [$org, , $room, $contract] = $this->setupContract('PENDING_TERMINATION');

        $admin = User::factory()->create(['org_id' => $org->id]);
        $handover = Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'created_by_user_id' => $admin->id,
        ]);

        event(new HandoverSubmitted($handover, $contract, []));

        $row = ContractStatusHistory::query()
            ->where('contract_id', $contract->id)
            ->where('event_type', ContractStatusHistory::EVENT_HANDOVER_SUBMITTED)
            ->first();

        $this->assertNotNull($row);
        $this->assertSame($handover->id, $row->payload['handover_id'] ?? null);
    }

    public function test_final_invoice_generated_event_writes_milestone(): void
    {
        [$org, $property, $room, $contract] = $this->setupContract('PENDING_TERMINATION');

        $invoice = Invoice::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => 'DRAFT',
            'period_start' => now()->toDateString(),
            'period_end' => now()->toDateString(),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addWeek()->toDateString(),
            'total_amount' => 1_500_000,
            'is_termination' => true,
            'snapshot' => ['billing_mode' => 'combined'],
        ]);

        event(new FinalInvoiceGenerated($invoice));

        $row = ContractStatusHistory::query()
            ->where('contract_id', $contract->id)
            ->where('event_type', ContractStatusHistory::EVENT_FINAL_INVOICE_GENERATED)
            ->first();

        $this->assertNotNull($row);
        $this->assertSame($invoice->id, $row->payload['invoice_id'] ?? null);
        $this->assertSame('combined', $row->payload['billing_mode'] ?? null);
    }

    public function test_settlement_payment_required_event_writes_milestone(): void
    {
        [$org, $property, $room, $contract] = $this->setupContract('PENDING_SETTLEMENT');

        $invoice = Invoice::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => 'ISSUED',
            'period_start' => now()->toDateString(),
            'period_end' => now()->toDateString(),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addWeek()->toDateString(),
            'total_amount' => 2_000_000,
            'is_termination' => true,
        ]);

        $fpr = FinalPaymentRequest::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'invoice_id' => $invoice->id,
            'amount_due' => 1_200_000,
            'status' => 'PENDING',
        ]);

        event(new SettlementPaymentRequired($contract, $fpr));

        $row = ContractStatusHistory::query()
            ->where('contract_id', $contract->id)
            ->where('event_type', ContractStatusHistory::EVENT_SETTLEMENT_PAYMENT_REQUESTED)
            ->first();

        $this->assertNotNull($row);
        $this->assertSame($fpr->id, $row->payload['final_payment_request_id'] ?? null);
        $this->assertSame($invoice->id, $row->payload['invoice_id'] ?? null);
    }

    public function test_settlement_resolved_event_writes_milestone(): void
    {
        [, , , $contract] = $this->setupContract('PENDING_SETTLEMENT');

        event(new SettlementResolved($contract, null, 'fake-refund-receipt-id'));

        $this->assertDatabaseHas('contract_status_histories', [
            'contract_id' => $contract->id,
            'event_type' => ContractStatusHistory::EVENT_SETTLEMENT_RESOLVED,
        ]);
    }

    public function test_debt_reconciliation_event_writes_milestone(): void
    {
        [$org, $property, $room, $contract] = $this->setupContract('PENDING_SETTLEMENT');

        $invoice = Invoice::create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'status' => 'DRAFT',
            'period_start' => now()->toDateString(),
            'period_end' => now()->toDateString(),
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addWeek()->toDateString(),
            'total_amount' => 1_000_000,
            'is_termination' => true,
        ]);

        event(new DebtReconciliationTriggered($contract, $invoice));

        $this->assertDatabaseHas('contract_status_histories', [
            'contract_id' => $contract->id,
            'event_type' => ContractStatusHistory::EVENT_DEBT_RECONCILIATION,
        ]);
    }

    public function test_endpoint_returns_correct_schema_for_staff(): void
    {
        [$org, , , $contract] = $this->setupContract('PENDING_SIGNATURE');

        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $contract->update(['status' => 'PENDING_PAYMENT']);

        $response = $this->actingAs($admin)
            ->getJson("/api/contracts/{$contract->id}/status-histories");

        $response->assertOk();

        $payload = $response->json('data');
        $this->assertIsArray($payload);
        $this->assertGreaterThanOrEqual(1, count($payload));

        $first = $payload[0];
        $this->assertArrayHasKey('event_type', $first);
        $this->assertArrayHasKey('from_status', $first);
        $this->assertArrayHasKey('to_status', $first);
        $this->assertArrayHasKey('notes', $first);
        $this->assertArrayHasKey('payload', $first);
        $this->assertArrayHasKey('created_at', $first);
    }

    public function test_tenant_can_view_their_own_contract_history(): void
    {
        [$org, , , $contract] = $this->setupContract(ContractStatus::ACTIVE->value);

        $tenant = User::factory()->create(['org_id' => $org->id]);
        $tenant->assignRole('Tenant');
        ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenant->id,
            'full_name' => $tenant->full_name,
            'status' => 'APPROVED',
            'is_primary' => true,
        ]);

        $response = $this->actingAs($tenant)
            ->getJson("/api/contracts/{$contract->id}/status-histories");

        $response->assertOk();
    }

    public function test_tenant_cannot_view_other_contract_history(): void
    {
        [$org, , , $contract] = $this->setupContract(ContractStatus::ACTIVE->value);

        $tenant = User::factory()->create(['org_id' => $org->id]);
        $tenant->assignRole('Tenant');

        $response = $this->actingAs($tenant)
            ->getJson("/api/contracts/{$contract->id}/status-histories");

        $response->assertForbidden();
    }
}
