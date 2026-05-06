<?php

namespace Database\Seeders;

use App\Models\Contract\ContractMember;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentAllocation;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Services\Finance\LedgerService;
use App\Services\Finance\ReceiptService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seeder thủ công (chạy riêng, không nằm trong DatabaseSeeder).
 *
 * Tạo 1 Payment mẫu cho một invoice chưa được thanh toán (status=ISSUED/OVERDUE)
 * rồi ghi sổ cái qua LedgerService để đảm bảo bút toán kép và meta đầy đủ.
 *
 * Chạy: php artisan db:seed --class=PaymentRelatedTablesSeeder
 */
class PaymentRelatedTablesSeeder extends Seeder
{
    public function __construct(
        protected LedgerService $ledgerService,
        protected ReceiptService $receiptService,
    ) {}

    public function run(): void
    {
        $org = Org::inRandomOrder()->first();
        if (! $org) {
            $this->command->warn('Chưa có dữ liệu ở bảng orgs. Bỏ qua seed thanh toán.');
            return;
        }

        // Tìm invoice chưa thanh toán (ISSUED hoặc OVERDUE) có hợp đồng + tenant member
        $invoice = Invoice::withoutGlobalScope('org_id')
            ->where('org_id', $org->id)
            ->whereIn('status', ['ISSUED', 'OVERDUE'])
            ->whereDoesntHave('allocations')
            ->whereNotNull('contract_id')
            ->inRandomOrder()
            ->first();

        if (! $invoice) {
            $this->command->warn('Không tìm thấy invoice phù hợp để seed payment.');
            return;
        }

        // Lấy payer là tenant chính của hợp đồng
        $tenantMember = ContractMember::withoutGlobalScope('org_id')
            ->where('contract_id', $invoice->contract_id)
            ->whereIn('role', ['TENANT', 'PRIMARY'])
            ->orderByRaw("CASE WHEN role = 'TENANT' THEN 0 ELSE 1 END")
            ->first();

        $ownerUserId = \App\Models\Org\User::withoutGlobalScope('org_id')
            ->where('org_id', $org->id)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['Owner', 'Manager']))
            ->inRandomOrder()
            ->value('id');

        $payerUserId = $tenantMember?->user_id ?? $ownerUserId;
        $total = (float) $invoice->total_amount;

        if ($total <= 0) {
            $this->command->warn('Invoice có tổng tiền = 0, bỏ qua.');
            return;
        }

        // Tạo Payment qua Eloquent để PaymentObserver kích hoạt (broadcast, cache clear, v.v.)
        // Nhưng KHÔNG để observer tự ghi ledger vì có thể bị queue → dùng seedLedgerForPaymentIfMissing.
        $payment = Payment::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'property_id' => $invoice->property_id,
            'payer_user_id' => $payerUserId,
            'received_by_user_id' => $ownerUserId,
            'method' => 'TRANSFER',
            'amount' => $total,
            'reference' => 'CK-SEED-'.strtoupper(substr((string) Str::uuid(), 0, 8)),
            'received_at' => Carbon::parse($invoice->due_date ?? now())->subDays(1),
            'status' => 'APPROVED',
            'approved_by_user_id' => $ownerUserId,
            'approved_at' => Carbon::parse($invoice->due_date ?? now())->subDays(1),
            'note' => 'Thanh toán tiền nhà (seed)',
        ]);

        // Tạo allocation trước khi ghi ledger để LedgerService có thể loadMissing
        PaymentAllocation::create([
            'id' => (string) Str::uuid(),
            'org_id' => $org->id,
            'payment_id' => $payment->id,
            'invoice_id' => $invoice->id,
            'amount' => $total,
        ]);

        // Ghi sổ cái qua LedgerService → bút toán kép + meta đầy đủ (payer_name, description, v.v.)
        $existing = \App\Models\Finance\LedgerEntry::withoutGlobalScope('org_id')
            ->where('ref_type', 'payment')
            ->where('ref_id', $payment->id)
            ->count();
        if ($existing === 0) {
            try {
                $this->ledgerService->recordPayment($payment);
                $this->command->info("  ✓ Ledger ghi nhận: payment {$payment->id}");
            } catch (\Throwable $e) {
                $this->command->warn("  - Ledger seed thất bại: {$e->getMessage()}");
            }
        }

        // Phát hành biên lai PDF
        try {
            $this->receiptService->generateForPayment($payment);
        } catch (\Throwable $e) {
            $this->command->warn("  - Biên lai seed thất bại: {$e->getMessage()}");
        }

        // Cập nhật trạng thái invoice
        $invoice->update([
            'status' => 'PAID',
            'paid_amount' => $total,
        ]);

        $tenantName = $tenantMember?->full_name ?? '(không rõ)';
        $this->command->info("  ✓ Payment seed thành công — khách: {$tenantName}, invoice: {$invoice->id}, số tiền: {$total}");
    }
}
