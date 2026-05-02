<?php

namespace Tests\Feature\Finance;

use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Contract\RefundReceipt;
use App\Models\Handover\Handover;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\TenantManager;
use Database\Seeders\RBACSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RefundReceiptMarkPaidTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RBACSeeder::class);
        Storage::fake('public');
    }

    public function test_owner_can_mark_refund_as_paid_and_pdf_is_generated(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $tenantUser = User::factory()->create(['org_id' => $org->id]);
        $tenantUser->assignRole('Tenant');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'name' => 'P.101',
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'deposit_amount' => 5_000_000,
            'deposit_status' => DepositStatus::REFUND_PENDING,
            'refunded_amount' => 0,
        ]);

        ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'user_id' => $tenantUser->id,
            'full_name' => $tenantUser->full_name,
            'phone' => $tenantUser->phone,
            'identity_number' => '012345678901',
            'role' => 'TENANT',
            'status' => 'APPROVED',
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $receipt = RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 3_500_000,
            'meta' => ['note' => 'Hoàn cọc sau cấn trừ.'],
        ]);

        $response = $this->actingAs($owner)
            ->postJson("/api/finance/refund-receipts/{$receipt->id}/mark-paid", [
                'payout_method' => 'TRANSFER',
                'payout_reference' => 'VCB-001',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.payout_method', 'TRANSFER')
            ->assertJsonPath('data.payout_reference', 'VCB-001');

        $this->assertNotNull($response->json('data.paid_at'));
        $this->assertNotNull($response->json('data.pdf_url'));
        $this->assertNotNull($response->json('data.reference'));

        $receipt->refresh();
        $this->assertNotNull($receipt->paid_at);
        $this->assertNotNull($receipt->pdf_path);
        $this->assertSame((string) $owner->id, (string) $receipt->paid_by_user_id);
        Storage::disk('public')->assertExists($receipt->pdf_path);

        $contract->refresh();
        $this->assertSame(DepositStatus::REFUNDED, $contract->deposit_status);
        $this->assertSame(3_500_000.0, (float) $contract->refunded_amount);
    }

    public function test_mark_paid_is_idempotent_on_second_call(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
        ]);
        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'deposit_amount' => 4_000_000,
            'deposit_status' => DepositStatus::REFUND_PENDING,
        ]);

        $receipt = RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 2_000_000,
        ]);

        $first = $this->actingAs($owner)
            ->postJson("/api/finance/refund-receipts/{$receipt->id}/mark-paid", [
                'payout_method' => 'CASH',
            ])
            ->assertOk();

        $firstReference = $first->json('data.reference');
        $firstPaidAt = $first->json('data.paid_at');
        $this->assertNotNull($firstReference);
        $this->assertNotNull($firstPaidAt);

        $second = $this->actingAs($owner)
            ->postJson("/api/finance/refund-receipts/{$receipt->id}/mark-paid", [
                'payout_method' => 'TRANSFER',
                'payout_reference' => 'X-9',
            ])
            ->assertOk();

        $this->assertSame($firstReference, $second->json('data.reference'));
        $this->assertSame($firstPaidAt, $second->json('data.paid_at'));
    }

    public function test_tenant_only_sees_paid_refund_receipts_of_own_contract(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $alice = User::factory()->create(['org_id' => $org->id]);
        $alice->assignRole('Tenant');
        $bob = User::factory()->create(['org_id' => $org->id]);
        $bob->assignRole('Tenant');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $roomA = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
        $roomB = Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);

        $contractA = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $roomA->id,
            'deposit_amount' => 3_000_000,
            'deposit_status' => DepositStatus::REFUND_PENDING,
        ]);
        $contractB = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $roomB->id,
            'deposit_amount' => 3_000_000,
            'deposit_status' => DepositStatus::REFUND_PENDING,
        ]);

        ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contractA->id,
            'user_id' => $alice->id,
            'full_name' => $alice->full_name,
            'phone' => $alice->phone,
            'identity_number' => '012345678901',
            'role' => 'TENANT',
            'status' => 'APPROVED',
            'is_primary' => true,
            'joined_at' => now(),
        ]);
        ContractMember::create([
            'org_id' => $org->id,
            'contract_id' => $contractB->id,
            'user_id' => $bob->id,
            'full_name' => $bob->full_name,
            'phone' => $bob->phone,
            'identity_number' => '012345678902',
            'role' => 'TENANT',
            'status' => 'APPROVED',
            'is_primary' => true,
            'joined_at' => now(),
        ]);

        $receiptA = RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contractA->id,
            'amount' => 1_500_000,
        ]);
        // Phiếu B chưa mark-paid → không nằm trong list của Bob
        RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contractB->id,
            'amount' => 1_000_000,
        ]);

        // BQL mark-paid phiếu A
        $this->actingAs($owner)
            ->postJson("/api/finance/refund-receipts/{$receiptA->id}/mark-paid", [
                'payout_method' => 'TRANSFER',
            ])
            ->assertOk();

        // Alice thấy 1 phiếu của mình
        $aliceList = $this->actingAs($alice)->getJson('/api/app/refund-receipts');
        $aliceList->assertOk();
        $this->assertSame(1, $aliceList->json('meta.total'));
        $this->assertSame((string) $contractA->id, $aliceList->json('data.0.contract_id'));

        // Alice không xem được phiếu của Bob (404)
        $stranger = $this->actingAs($alice)->getJson("/api/app/refund-receipts/{$receiptA->id}");
        $stranger->assertOk();

        $bobList = $this->actingAs($bob)->getJson('/api/app/refund-receipts');
        $bobList->assertOk();
        $this->assertSame(0, $bobList->json('meta.total'));

        $bobAttempt = $this->actingAs($bob)->getJson("/api/app/refund-receipts/{$receiptA->id}");
        $bobAttempt->assertStatus(404);
    }

    public function test_handover_show_returns_refund_receipt_after_mark_paid(): void
    {
        $org = Org::factory()->create();
        TenantManager::setOrgId($org->id);

        $owner = User::factory()->create(['org_id' => $org->id]);
        $owner->assignRole('Owner');

        $property = Property::factory()->create(['org_id' => $org->id]);
        $room = Room::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
        ]);

        $contract = Contract::factory()->create([
            'org_id' => $org->id,
            'property_id' => $property->id,
            'room_id' => $room->id,
            'deposit_amount' => 4_500_000,
            'deposit_status' => DepositStatus::REFUND_PENDING,
        ]);

        $handover = Handover::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'room_id' => $room->id,
            'created_by_user_id' => $owner->id,
            'note' => 'Bàn giao trả phòng',
        ]);

        $receipt = RefundReceipt::create([
            'org_id' => $org->id,
            'contract_id' => $contract->id,
            'amount' => 2_500_000,
        ]);

        // Trước khi mark-paid: handover.refund_receipt vẫn có nhưng pdf_url null.
        $before = $this->actingAs($owner)->getJson("/api/handovers/{$handover->id}");
        $before->assertOk();
        $this->assertSame((string) $receipt->id, $before->json('data.refund_receipt.id'));
        $this->assertNull($before->json('data.refund_receipt.pdf_url'));
        $this->assertNull($before->json('data.refund_receipt.paid_at'));

        // BQL mark-paid → sinh PDF.
        $this->actingAs($owner)
            ->postJson("/api/finance/refund-receipts/{$receipt->id}/mark-paid", [
                'payout_method' => 'TRANSFER',
                'payout_reference' => 'VCB-XYZ',
            ])
            ->assertOk();

        $after = $this->actingAs($owner)->getJson("/api/handovers/{$handover->id}");
        $after->assertOk()
            ->assertJsonPath('data.refund_receipt.id', (string) $receipt->id)
            ->assertJsonPath('data.refund_receipt.payout_method', 'TRANSFER')
            ->assertJsonPath('data.refund_receipt.payout_reference', 'VCB-XYZ');
        $this->assertNotNull($after->json('data.refund_receipt.pdf_url'));
        $this->assertNotNull($after->json('data.refund_receipt.paid_at'));
        $this->assertSame('REFUNDED', $after->json('data.refund_receipt.deposit_status'));
    }
}
