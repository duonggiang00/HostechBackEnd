<?php

namespace Tests\Feature\Contract;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Invoice\Invoice;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Service\RoomService;
use App\Models\Service\Service;
use App\Models\Service\ServiceRate;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ContractRoomTransferTest extends TestCase
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
     * Tạo bộ dữ liệu phòng + đồng hồ điện (đã chốt số APPROVED đến hôm nay).
     *
     * @return array{org: Org, admin: User, property: Property, oldRoom: Room, newRoom: Room, contract: Contract, meter: Meter}
     */
    private function bootstrapTransferScenario(array $overrides = []): array
    {
        $org = Org::factory()->create();
        $admin = User::factory()->create(['org_id' => $org->id]);
        $admin->assignRole('Admin');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $oldRoom = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'occupied',
            'base_price' => 3_000_000,
        ]);
        $newRoom = Room::factory()->create([
            'property_id' => $property->id,
            'org_id' => $org->id,
            'status' => 'available',
            'base_price' => $overrides['new_room_base_price'] ?? 3_500_000,
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $oldRoom->id,
            'status' => ContractStatus::ACTIVE,
            'rent_price' => 3_000_000,
            'deposit_amount' => 6_000_000,
            'deposit_months' => 2,
            'deposit_status' => DepositStatus::HELD,
            'start_date' => now()->subMonths(2)->toDateString(),
            'end_date' => now()->addMonths(10)->toDateString(),
            'created_by_user_id' => $admin->id,
        ]);

        $tenantUser = User::factory()->create(['org_id' => $org->id]);
        ContractMember::factory()->create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenantUser->id,
            'is_primary' => true,
            'status' => 'APPROVED',
            'role' => 'TENANT',
        ]);

        // Service ELECTRIC + rate + room_service
        $electric = Service::factory()->electric()->create([
            'org_id' => $org->id,
        ]);
        ServiceRate::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'service_id' => $electric->id,
            'effective_from' => now()->subMonths(6)->toDateString(),
            'price' => 3500,
            'created_by_user_id' => $admin->id,
        ]);
        RoomService::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'room_id' => $oldRoom->id,
            'service_id' => $electric->id,
            'quantity' => 1,
            'included_units' => 0,
        ]);

        // Đồng hồ điện phòng cũ + 2 chỉ số (kỳ trước = 1000, hôm nay = 1100 → tiêu thụ 100 kWh)
        $meter = Meter::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $oldRoom->id,
            'service_id' => $electric->id,
            'code' => 'ELEC-OLD-01',
            'type' => 'ELECTRIC',
            'is_active' => true,
            'base_reading' => 0,
        ]);

        MeterReading::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'meter_id' => $meter->id,
            'period_start' => now()->subMonth()->toDateString(),
            'period_end' => now()->subDays(15)->toDateString(),
            'reading_value' => 1000,
            'consumption' => 0,
            'status' => 'APPROVED',
        ]);
        MeterReading::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'meter_id' => $meter->id,
            'period_start' => now()->subDays(14)->toDateString(),
            'period_end' => now()->toDateString(),
            'reading_value' => 1100,
            'consumption' => 100,
            'status' => 'APPROVED',
        ]);

        return compact('org', 'admin', 'property', 'oldRoom', 'newRoom', 'contract', 'meter');
    }

    /**
     * @return ?string invoice id khi có dòng phát sinh, null nếu không
     */
    private function postIssueRoomTransferInvoice(User $admin, Contract $contract, string $newRoomId, string $transferDate, ?float $rentPrice = null): ?string
    {
        $body = [
            'target_room_id' => $newRoomId,
            'transfer_date' => $transferDate,
        ];
        if ($rentPrice !== null) {
            $body['rent_price'] = $rentPrice;
        }
        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/transfer/issue-final-invoice", $body);

        $response->assertOk();

        return $response->json('data.invoice_id');
    }

    public function test_transfer_preview_returns_meter_and_line_flags(): void
    {
        ['admin' => $admin, 'newRoom' => $newRoom, 'contract' => $contract]
            = $this->bootstrapTransferScenario();

        $date = now()->toDateString();
        $response = $this->actingAs($admin)->call(
            'GET',
            '/api/contracts/'.$contract->id.'/transfer/preview',
            [
                'target_room_id' => $newRoom->id,
                'transfer_date' => $date,
                'rent_price' => 3_500_000,
            ],
            [],
            [],
            ['HTTP_ACCEPT' => 'application/json'],
        );

        $response->assertOk();
        $response->assertJsonPath('data.meters_sealed', true);
        $response->assertJsonPath('data.has_invoice_lines', true);
        $this->assertGreaterThan(0, count($response->json('data.line_preview')));
    }

    public function test_happy_path_room_transfer_terminates_old_contract_and_creates_new_active_contract_inheriting_deposit(): void
    {
        ['admin' => $admin, 'oldRoom' => $oldRoom, 'newRoom' => $newRoom, 'contract' => $contract]
            = $this->bootstrapTransferScenario();

        $transferDate = now()->toDateString();
        $invoiceId = $this->postIssueRoomTransferInvoice($admin, $contract, $newRoom->id, $transferDate);
        $this->assertNotNull($invoiceId);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/execute-transfer", [
                'target_room_id' => $newRoom->id,
                'transfer_date' => $transferDate,
                'linked_transfer_invoice_id' => $invoiceId,
            ]);

        $response->assertOk();
        $newContractId = $response->json('data.new_contract_id');
        $this->assertNotEmpty($newContractId);

        // HĐ cũ → TERMINATED
        $contract->refresh();
        $this->assertSame(ContractStatus::TERMINATED, $contract->status);
        $this->assertNotNull($contract->terminated_at);
        $this->assertSame(now()->toDateString(), $contract->end_date->toDateString());
        $this->assertNotNull($contract->meta['room_transfer'] ?? null);
        $this->assertSame((string) $newRoom->id, (string) $contract->meta['room_transfer']['to_room_id']);
        $this->assertSame('simple_transfer_v1', $contract->meta['room_transfer']['pipeline']);

        // HĐ mới → ACTIVE, kế thừa cọc nguyên xi
        $newContract = Contract::query()->findOrFail($newContractId);
        $this->assertSame(ContractStatus::ACTIVE, $newContract->status);
        $this->assertSame((string) $newRoom->id, (string) $newContract->room_id);
        $this->assertEqualsWithDelta(6_000_000, (float) $newContract->deposit_amount, 0.01);
        $this->assertSame(DepositStatus::HELD, $newContract->deposit_status);
        $this->assertSame((string) $contract->id, (string) ($newContract->meta['deposit_inherited_from'] ?? null));

        // Member kế thừa với status APPROVED
        $this->assertCount(1, $newContract->members()->where('is_primary', true)->get());

        // Hóa đơn chuyển phòng — gán sang HĐ mới, không phải hóa đơn thanh lý
        $finalInvoice = Invoice::query()->findOrFail($invoiceId);
        $this->assertSame((string) $newContract->id, (string) $finalInvoice->contract_id);
        $this->assertSame((string) $newRoom->id, (string) $finalInvoice->room_id);
        $this->assertSame('ISSUED', $finalInvoice->status);
        $this->assertFalse((bool) $finalInvoice->is_termination);
        $this->assertGreaterThan(0, (float) $finalInvoice->total_amount);
        $this->assertSame((string) $contract->id, (string) ($finalInvoice->snapshot['transfer_invoice_original_contract_id'] ?? ''));

        // Phòng cũ → available, phòng mới → occupied
        $oldRoom->refresh();
        $newRoom->refresh();
        $this->assertSame('available', $oldRoom->status);
        $this->assertSame('occupied', $newRoom->status);
    }

    public function test_room_transfer_blocks_when_meter_readings_missing(): void
    {
        ['admin' => $admin, 'newRoom' => $newRoom, 'contract' => $contract, 'meter' => $meter]
            = $this->bootstrapTransferScenario();

        // Reset toàn bộ chỉ số → không còn APPROVED đến ngày chuyển
        MeterReading::query()->where('meter_id', $meter->id)->update(['status' => 'DRAFT']);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/execute-transfer", [
                'target_room_id' => $newRoom->id,
                'transfer_date' => now()->toDateString(),
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Chưa chốt số đồng hồ', (string) $response->json('message'));

        $contract->refresh();
        $this->assertSame(ContractStatus::ACTIVE, $contract->status);
    }

    public function test_room_transfer_blocks_when_old_contract_has_outstanding_invoice(): void
    {
        ['admin' => $admin, 'newRoom' => $newRoom, 'contract' => $contract, 'oldRoom' => $oldRoom]
            = $this->bootstrapTransferScenario();

        Invoice::create([
            'id' => (string) Str::uuid(),
            'org_id' => $contract->org_id,
            'property_id' => $contract->property_id,
            'room_id' => $oldRoom->id,
            'contract_id' => $contract->id,
            'status' => 'ISSUED',
            'issue_date' => now()->subDays(20)->toDateString(),
            'due_date' => now()->subDays(5)->toDateString(),
            'period_start' => now()->subDays(40)->toDateString(),
            'period_end' => now()->subDays(11)->toDateString(),
            'total_amount' => 1_500_000,
            'paid_amount' => 0,
            'is_termination' => false,
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/execute-transfer", [
                'target_room_id' => $newRoom->id,
                'transfer_date' => now()->toDateString(),
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('hóa đơn chưa thanh toán', (string) $response->json('message'));

        $contract->refresh();
        $this->assertSame(ContractStatus::ACTIVE, $contract->status);
    }

    public function test_execute_transfer_requires_pre_issued_invoice_when_invoice_lines_exist(): void
    {
        ['admin' => $admin, 'newRoom' => $newRoom, 'contract' => $contract]
            = $this->bootstrapTransferScenario();

        $transferDate = now()->toDateString();

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/execute-transfer", [
                'target_room_id' => $newRoom->id,
                'transfer_date' => $transferDate,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('phát hành hóa đơn', mb_strtolower((string) $response->json('message')));
    }

    public function test_room_transfer_does_not_add_rent_delta_when_new_room_is_cheaper_or_equal(): void
    {
        ['admin' => $admin, 'newRoom' => $newRoom, 'contract' => $contract]
            = $this->bootstrapTransferScenario(['new_room_base_price' => 2_500_000]);

        $transferDate = now()->toDateString();
        $invoiceId = $this->postIssueRoomTransferInvoice($admin, $contract, $newRoom->id, $transferDate, 2_500_000);
        $this->assertNotNull($invoiceId);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/execute-transfer", [
                'target_room_id' => $newRoom->id,
                'transfer_date' => $transferDate,
                'rent_price' => 2_500_000,
                'linked_transfer_invoice_id' => $invoiceId,
            ]);

        $response->assertOk();

        $invoice = Invoice::query()->whereKey($invoiceId)->with('items')->firstOrFail();
        $this->assertSame((string) $response->json('data.new_contract_id'), (string) $invoice->contract_id);

        $deltaItems = $invoice->items->filter(fn ($item) => ($item->meta['source'] ?? null) === 'room_transfer_rent_delta');
        $this->assertTrue($deltaItems->isEmpty(), 'Không được phát sinh dòng chênh lệch khi phòng mới rẻ hơn.');
    }

    public function test_room_transfer_adds_positive_rent_delta_when_new_room_is_more_expensive(): void
    {
        ['admin' => $admin, 'newRoom' => $newRoom, 'contract' => $contract]
            = $this->bootstrapTransferScenario();

        // Cố định transfer_date = ngày 5 của tháng → còn lại = daysInMonth - 4 ngày
        $transferDate = now()->startOfMonth()->addDays(4);
        $transferDateStr = $transferDate->toDateString();

        $invoiceId = $this->postIssueRoomTransferInvoice($admin, $contract, $newRoom->id, $transferDateStr, 3_500_000);
        $this->assertNotNull($invoiceId);

        $response = $this->actingAs($admin)
            ->postJson("/api/contracts/{$contract->id}/execute-transfer", [
                'target_room_id' => $newRoom->id,
                'transfer_date' => $transferDateStr,
                'rent_price' => 3_500_000,
                'linked_transfer_invoice_id' => $invoiceId,
            ]);

        $response->assertOk();

        $invoice = Invoice::query()->whereKey($invoiceId)->with('items')->firstOrFail();
        $this->assertSame((string) $response->json('data.new_contract_id'), (string) $invoice->contract_id);

        $deltaItem = $invoice->items->first(fn ($item) => ($item->meta['source'] ?? null) === 'room_transfer_rent_delta');
        $this->assertNotNull($deltaItem, 'Phải có dòng chênh lệch tiền phòng.');

        $daysInMonth = (int) $transferDate->daysInMonth;
        $daysRemaining = $daysInMonth - (int) $transferDate->day + 1;
        $expected = round((3_500_000 - 3_000_000) * ($daysRemaining / $daysInMonth), 0);
        $this->assertEqualsWithDelta($expected, (float) $deltaItem->amount, 1.0);
    }
}
