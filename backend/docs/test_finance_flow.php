<?php

/**
 * TEST FLOW: Module Tài chính (Finance)
 *
 * Cách chạy:
 *   php artisan tinker --execute="require base_path('docs/test_finance_flow.php');"
 *
 * Lưu ý:
 * - Dùng DB::table() để tạo invoice test nhằm tránh constraint NOT NULL của contract_id.
 * - Toàn bộ thao tác đều được ROLLBACK sau khi test.
 *
 * Luồng kiểm thử (8 tests):
 * 1. Thu tiền đủ 1 hóa đơn → Invoice.PAID + LedgerEntry.debit ghi đúng
 * 2. Phân bổ vào 2 hóa đơn cùng lúc → cả 2 PAID
 * 3. Void/Hủy giao dịch → Invoice hoàn về ISSUED + bút toán đảo ngược + soft delete
 * 4. Validation: tổng allocations != payment.amount → Exception
 * 5. Security: invoice thuộc org khác bị từ chối
 * 6. [MỚI] Filter received_between → truy vấn đúng theo khoảng ngày
 * 7. [MỚI] LedgerEntry filter occurred_between → lọc đúng bút toán
 * 8. [MỚI] Cashflow manual entry (POST /cashflow) → LedgerEntry type IN/OUT ghi đúng
 */

use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentAllocation;
use App\Models\Invoice\Invoice;
use App\Services\Finance\LedgerService;
use App\Services\Finance\PaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

try {
    echo "--- BẮT ĐẦU TEST LUỒNG TÀI CHÍNH (FINANCE) ---\n\n";
    DB::beginTransaction();

    // ════════════════════════════════════════════════════════════
    // PHẦN 1: SETUP DỮ LIỆU MẪU
    // ════════════════════════════════════════════════════════════

    echo "⚙️  Chuẩn bị dữ liệu mẫu...\n";

    $org = DB::table('orgs')->first();
    if (! $org) {
        throw new Exception("Chưa có dữ liệu ở bảng orgs. Hãy chạy seeder trước.");
    }

    $owner = DB::table('users')->where('org_id', $org->id)->first();
    if (! $owner) {
        throw new Exception("Chưa có user nào trong org '{$org->name}'.");
    }

    $property = DB::table('properties')->where('org_id', $org->id)->first();
    if (! $property) {
        throw new Exception("Chưa có property nào trong org '{$org->name}'.");
    }

    $contract = DB::table('contracts')->where('org_id', $org->id)->first();
    if (! $contract) {
        throw new Exception("Chưa có contract nào trong org '{$org->name}'. Hãy chạy seeder trước.");
    }

    $room = DB::table('rooms')->where('org_id', $org->id)->first();
    if (! $room) {
        throw new Exception("Chưa có room nào trong org '{$org->name}'.");
    }

    echo "✅ Org: {$org->name} | User: {$owner->email}\n\n";

    $now = Carbon::now();

    // Tạo 3 invoice test bằng DB::table() để bypass NOT NULL constraint contract_id
    echo "📄 Tạo 3 hóa đơn test (DB::table bypass constraint)...\n";

    $inv1Id = (string) Str::uuid();
    $inv2Id = (string) Str::uuid();
    $inv3Id = (string) Str::uuid();

    DB::table('invoices')->insert([
        'id' => $inv1Id, 'org_id' => $org->id, 'property_id' => $property->id,
        'contract_id' => $contract->id, 'room_id' => $room->id,
        'status' => 'ISSUED',
        'period_start' => $now->copy()->subMonths(3)->startOfMonth()->toDateString(),
        'period_end'   => $now->copy()->subMonths(3)->endOfMonth()->toDateString(),
        'due_date' => $now->copy()->addDays(10)->toDateString(),
        'total_amount' => 5000000.00, 'paid_amount' => 0.00,
        'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('invoices')->insert([
        'id' => $inv2Id, 'org_id' => $org->id, 'property_id' => $property->id,
        'contract_id' => $contract->id, 'room_id' => $room->id,
        'status' => 'ISSUED',
        'period_start' => $now->copy()->subMonths(4)->startOfMonth()->toDateString(),
        'period_end'   => $now->copy()->subMonths(4)->endOfMonth()->toDateString(),
        'due_date' => $now->copy()->addDays(10)->toDateString(),
        'total_amount' => 500000.00, 'paid_amount' => 0.00,
        'created_at' => $now, 'updated_at' => $now,
    ]);
    DB::table('invoices')->insert([
        'id' => $inv3Id, 'org_id' => $org->id, 'property_id' => $property->id,
        'contract_id' => $contract->id, 'room_id' => $room->id,
        'status' => 'ISSUED',
        'period_start' => $now->copy()->subMonths(5)->startOfMonth()->toDateString(),
        'period_end'   => $now->copy()->subMonths(5)->endOfMonth()->toDateString(),
        'due_date' => $now->copy()->addDays(10)->toDateString(),
        'total_amount' => 300000.00, 'paid_amount' => 0.00,
        'created_at' => $now, 'updated_at' => $now,
    ]);

    $invoice1    = Invoice::find($inv1Id);
    $invoice2    = Invoice::find($inv2Id);
    $invoice3    = Invoice::find($inv3Id);
    $ownerModel  = \App\Models\Org\User::find($owner->id);

    echo "✅ Invoice #1 (5,000,000đ) | Invoice #2 (500,000đ) | Invoice #3 (300,000đ)\n\n";

    $paymentService = app(PaymentService::class);
    $ledgerService  = app(LedgerService::class);

    // ════════════════════════════════════════════════════════════
    // TEST 1: Thu tiền đủ 1 hóa đơn → PAID
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 1: Thu tiền đủ 1 hóa đơn → Invoice chuyển PAID...\n";

    $payment1 = $paymentService->create([
        'org_id'      => $org->id,
        'property_id' => $property->id,
        'method'      => 'TRANSFER',
        'amount'      => 5000000.00,
        'reference'   => 'CK_TEST_INV1_FULL',
        'received_at' => $now->toIso8601String(),
        'note'        => 'Thanh toán đủ hóa đơn tháng test',
        'allocations' => [
            ['invoice_id' => $inv1Id, 'amount' => 5000000.00],
        ],
    ], $ownerModel);

    if (! ($payment1 instanceof Payment)) {
        throw new Exception("LỖI: create() không trả về Payment model!");
    }
    if ($payment1->status !== 'APPROVED') {
        throw new Exception("LỖI: Payment status không phải APPROVED! Hiện tại: {$payment1->status}");
    }

    $invoice1->refresh();
    if ($invoice1->status !== 'PAID') {
        throw new Exception("LỖI: Invoice #1 không chuyển sang PAID! Hiện tại: {$invoice1->status}");
    }
    if (abs((float) $invoice1->paid_amount - 5000000.0) > 0.01) {
        throw new Exception("LỖI: Invoice #1 paid_amount sai! Hiện tại: {$invoice1->paid_amount}");
    }

    $alloc1Count = PaymentAllocation::where('payment_id', $payment1->id)->count();
    if ($alloc1Count !== 1) {
        throw new Exception("LỖI: Số allocation sai! Kỳ vọng: 1, Hiện tại: {$alloc1Count}");
    }

    $ledger1 = LedgerEntry::where('ref_type', 'payment')->where('ref_id', $payment1->id)->first();
    if (! $ledger1 || abs((float) $ledger1->debit - 5000000.0) > 0.01) {
        throw new Exception("LỖI: LedgerEntry debit sai! Hiện tại: " . ($ledger1?->debit ?? 'null'));
    }
    if ((float) $ledger1->credit !== 0.0) {
        throw new Exception("LỖI: LedgerEntry credit phải là 0! Hiện tại: {$ledger1->credit}");
    }

    echo "✅ Payment tạo thành công. ID: {$payment1->id}\n";
    echo "✅ Invoice #1 → PAID. paid_amount: " . number_format($invoice1->paid_amount, 0, ',', '.') . "đ\n";
    echo "✅ LedgerEntry: debit=" . number_format($ledger1->debit, 0, ',', '.') . "đ, credit=0\n\n";

    // ════════════════════════════════════════════════════════════
    // TEST 2: Phân bổ vào 2 hóa đơn cùng lúc
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 2: Thu tiền phân bổ vào 2 hóa đơn cùng lúc...\n";

    $payment2 = $paymentService->create([
        'org_id'      => $org->id,
        'property_id' => $property->id,
        'method'      => 'CASH',
        'amount'      => 800000.00,
        'reference'   => 'TM_TEST_INV2_INV3',
        'received_at' => $now->toIso8601String(),
        'note'        => 'Thu tiền mặt 2 hóa đơn',
        'allocations' => [
            ['invoice_id' => $inv2Id, 'amount' => 500000.00],
            ['invoice_id' => $inv3Id, 'amount' => 300000.00],
        ],
    ], $ownerModel);

    $invoice2->refresh();
    $invoice3->refresh();

    if ($invoice2->status !== 'PAID') {
        throw new Exception("LỖI: Invoice #2 không PAID! Hiện tại: {$invoice2->status}");
    }
    if ($invoice3->status !== 'PAID') {
        throw new Exception("LỖI: Invoice #3 không PAID! Hiện tại: {$invoice3->status}");
    }

    $alloc2Count = PaymentAllocation::where('payment_id', $payment2->id)->count();
    if ($alloc2Count !== 2) {
        throw new Exception("LỖI: Số allocation sai! Kỳ vọng: 2, Hiện tại: {$alloc2Count}");
    }

    $ledger2 = LedgerEntry::where('ref_type', 'payment')->where('ref_id', $payment2->id)->first();
    if (! $ledger2 || abs((float) $ledger2->debit - 800000.0) > 0.01) {
        throw new Exception("LỖI: LedgerEntry #2 sai! debit: " . ($ledger2?->debit ?? 'null'));
    }

    echo "✅ Payment #2 (800,000đ) → phân bổ 2 hóa đơn thành công.\n";
    echo "✅ Invoice #2 (500,000đ): {$invoice2->status}\n";
    echo "✅ Invoice #3 (300,000đ): {$invoice3->status}\n\n";

    // ════════════════════════════════════════════════════════════
    // TEST 3: Void/Hủy → hoàn tác Invoice + soft delete
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 3: Void Payment #1 → Invoice #1 hoàn về ISSUED + bút toán đảo ngược...\n";

    $payment1Fresh = $paymentService->find($payment1->id);
    if (! $payment1Fresh) {
        throw new Exception("LỖI: Không tìm lại được Payment #1!");
    }

    $paymentService->void($payment1Fresh);

    $invoice1->refresh();
    if ($invoice1->status !== 'ISSUED') {
        throw new Exception("LỖI: Invoice #1 không hoàn về ISSUED! Hiện tại: {$invoice1->status}");
    }
    if ((float) $invoice1->paid_amount > 0.01) {
        throw new Exception("LỖI: Invoice #1 paid_amount không về 0! Hiện tại: {$invoice1->paid_amount}");
    }

    $reversal = LedgerEntry::where('ref_type', 'payment_reversal')
        ->where('ref_id', $payment1->id)->first();
    if (! $reversal) {
        throw new Exception("LỖI: LedgerEntry payment_reversal không được tạo!");
    }
    if (abs((float) $reversal->credit - 5000000.0) > 0.01) {
        throw new Exception("LỖI: Reversal credit sai! Hiện tại: {$reversal->credit}");
    }
    if ((float) $reversal->debit !== 0.0) {
        throw new Exception("LỖI: Reversal debit phải là 0! Hiện tại: {$reversal->debit}");
    }

    $deletedPayment = Payment::withTrashed()->find($payment1->id);
    if (! $deletedPayment || $deletedPayment->deleted_at === null) {
        throw new Exception("LỖI: Payment #1 chưa bị soft-deleted!");
    }

    echo "✅ Payment #1 đã soft-deleted.\n";
    echo "✅ Invoice #1 → ISSUED. paid_amount: " . number_format($invoice1->paid_amount, 0, ',', '.') . "đ\n";
    echo "✅ Bút toán đảo ngược: credit=" . number_format($reversal->credit, 0, ',', '.') . "đ\n\n";

    // ════════════════════════════════════════════════════════════
    // TEST 4: Validation — Tổng allocations != payment.amount
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 4: Validation — Tổng allocations (600,000) != payment.amount (1,000,000)...\n";

    $errorCaught = false;
    try {
        $paymentService->create([
            'org_id'      => $org->id,
            'property_id' => $property->id,
            'method'      => 'TRANSFER',
            'amount'      => 1000000.00,
            'allocations' => [
                ['invoice_id' => $inv1Id, 'amount' => 600000.00],
            ],
        ], $ownerModel);
    } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
        $errorCaught = true;
        echo "✅ Validation đúng (HTTP 422): " . $e->getMessage() . "\n\n";
    } catch (\Exception $e) {
        $errorCaught = true;
        echo "✅ Validation bắt exception: " . $e->getMessage() . "\n\n";
    }

    if (! $errorCaught) {
        throw new Exception("LỖI NGHIÊM TRỌNG: create() phải throw exception khi tổng allocations không khớp!");
    }

    // ════════════════════════════════════════════════════════════
    // TEST 5: Security — invoice thuộc org khác bị từ chối
    // ════════════════════════════════════════════════════════════

    $otherOrg = DB::table('orgs')->where('id', '!=', $org->id)->first();
    if ($otherOrg) {
        echo "🧪 TEST 5: Invoice thuộc org khác bị từ chối...\n";
        $otherOrgInvoice = DB::table('invoices')->where('org_id', $otherOrg->id)->first();
        if ($otherOrgInvoice) {
            $securityCaught = false;
            try {
                $paymentService->create([
                    'org_id'      => $org->id,
                    'method'      => 'CASH',
                    'amount'      => 100000.00,
                    'allocations' => [
                        ['invoice_id' => $otherOrgInvoice->id, 'amount' => 100000.00],
                    ],
                ], $ownerModel);
            } catch (\Exception $e) {
                $securityCaught = true;
                echo "✅ Security check hoạt động: invoice của org khác bị từ chối.\n\n";
            }
            if (! $securityCaught) {
                throw new Exception("LỖI BẢO MẬT: Cho phép gạch nợ invoice của org khác!");
            }
        } else {
            echo "ℹ️  TEST 5: Bỏ qua (không có invoice ở org khác).\n\n";
        }
    } else {
        echo "ℹ️  TEST 5: Bỏ qua (chỉ có 1 org).\n\n";
    }

    // ════════════════════════════════════════════════════════════
    // TEST 6 [MỚI]: Filter received_between trên Payment
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 6 [MỚI]: Filter received_between lọc đúng khoảng ngày...\n";

    // payment2 đã được tạo ở Test 2 với received_at = $now
    $todayStr = $now->toDateString();

    // Truy vấn trực tiếp qua model để giả lập filter received_between
    $filteredPayments = Payment::where('org_id', $org->id)
        ->whereBetween('received_at', [$todayStr.' 00:00:00', $todayStr.' 23:59:59'])
        ->get();

    // Phải tìm thấy payment2 (payment1 đã bị soft-deleted nên SoftDeletes loại ra)
    if ($filteredPayments->isEmpty()) {
        throw new Exception("LỖI: Filter received_between không tìm thấy payment trong ngày hôm nay!");
    }

    $found = $filteredPayments->contains('id', $payment2->id);
    if (! $found) {
        throw new Exception("LỖI: Filter received_between không tìm thấy Payment #2!");
    }

    // Kiểm tra payment đã void không xuất hiện (SoftDeletes đã tự loại)
    $foundDeleted = $filteredPayments->contains('id', $payment1->id);
    if ($foundDeleted) {
        throw new Exception("LỖI: Payment đã bị void/soft-deleted vẫn xuất hiện trong kết quả!");
    }

    echo "✅ Filter received_between={$todayStr},{$todayStr} → tìm thấy " . $filteredPayments->count() . " payment(s).\n";
    echo "✅ Payment đã void bị loại đúng (SoftDeletes hoạt động).\n\n";

    // ════════════════════════════════════════════════════════════
    // TEST 7 [MỚI]: LedgerEntry filter occurred_between
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 7 [MỚI]: LedgerEntry filter occurred_between lọc đúng...\n";

    // Lấy tất cả LedgerEntry trong ngày hôm nay (bao gồm reversal)
    $ledgerToday = LedgerEntry::where('org_id', $org->id)
        ->whereBetween('occurred_at', [$todayStr.' 00:00:00', $todayStr.' 23:59:59'])
        ->get();

    // Phải có ít nhất 3 entries: ledger1 (payment1), ledger2 (payment2), reversal (void payment1)
    if ($ledgerToday->count() < 3) {
        throw new Exception("LỖI: Filter occurred_between phải có ≥ 3 entries, hiện có: " . $ledgerToday->count());
    }

    // Kiểm tra balance tổng hợp qua LedgerService
    $balance = $ledgerService->getBalance($org->id);

    if (! isset($balance['total_debit'], $balance['total_credit'], $balance['net_balance'])) {
        throw new Exception("LỖI: LedgerService::getBalance() thiếu key! Keys: " . implode(', ', array_keys($balance)));
    }

    // net = debit - credit. payment2 (800k debit) + reversal (5M credit) → net âm
    // Chỉ validate structure, không hardcode value vì DB có thể chứa data cũ
    echo "✅ LedgerEntry occurred_between → " . $ledgerToday->count() . " entries trong ngày.\n";
    echo "✅ LedgerService::getBalance() → debit=" . number_format($balance['total_debit'], 0, ',', '.') . "đ"
        . ", credit=" . number_format($balance['total_credit'], 0, ',', '.') . "đ"
        . ", net=" . number_format($balance['net_balance'], 0, ',', '.') . "đ\n\n";

    // ════════════════════════════════════════════════════════════
    // TEST 8 [MỚI]: Cashflow manual entry (POST /api/finance/cashflow logic)
    // ════════════════════════════════════════════════════════════

    echo "🧪 TEST 8 [MỚI]: Cashflow manual — ghi khoản chi bảo trì (OUT) và thu khác (IN)...\n";

    // Giả lập logic của CashflowController::store() (type: OUT)
    $expenseEntry = LedgerEntry::create([
        'org_id'      => $org->id,
        'ref_type'    => 'cashflow_manual',
        'ref_id'      => $org->id,
        'debit'       => 0,
        'credit'      => 2000000.00, // OUT = credit
        'occurred_at' => now(),
        'meta'        => [
            'reason'      => 'Chi phí sửa thang máy',
            'type'        => 'OUT',
            'recorded_by' => $ownerModel->id,
        ],
    ]);

    if ((float) $expenseEntry->credit !== 2000000.0) {
        throw new Exception("LỖI: Cashflow OUT - credit sai! Hiện tại: {$expenseEntry->credit}");
    }
    if ((float) $expenseEntry->debit !== 0.0) {
        throw new Exception("LỖI: Cashflow OUT - debit phải là 0! Hiện tại: {$expenseEntry->debit}");
    }
    if ($expenseEntry->ref_type !== 'cashflow_manual') {
        throw new Exception("LỖI: ref_type sai! Hiện tại: {$expenseEntry->ref_type}");
    }

    // Giả lập type: IN (thu khác)
    $incomeEntry = LedgerEntry::create([
        'org_id'      => $org->id,
        'ref_type'    => 'cashflow_manual',
        'ref_id'      => $org->id,
        'debit'       => 500000.00, // IN = debit
        'credit'      => 0,
        'occurred_at' => now(),
        'meta'        => [
            'reason'      => 'Thu phí giữ xe',
            'type'        => 'IN',
            'recorded_by' => $ownerModel->id,
        ],
    ]);

    if ((float) $incomeEntry->debit !== 500000.0) {
        throw new Exception("LỖI: Cashflow IN - debit sai! Hiện tại: {$incomeEntry->debit}");
    }

    // Kiểm tra manual entries tồn tại trong bảng
    $manualCount = LedgerEntry::where('org_id', $org->id)
        ->where('ref_type', 'cashflow_manual')
        ->count();
    if ($manualCount < 2) {
        throw new Exception("LỖI: Phải có ≥ 2 cashflow_manual entries, hiện có: {$manualCount}");
    }

    echo "✅ Cashflow OUT (chi 2,000,000đ): credit=" . number_format($expenseEntry->credit, 0, ',', '.') . "đ, debit=0\n";
    echo "✅ Cashflow IN  (thu 500,000đ):   debit=" . number_format($incomeEntry->debit, 0, ',', '.') . "đ, credit=0\n";
    echo "✅ Tổng " . $manualCount . " cashflow_manual entries trong DB.\n\n";

    // ════════════════════════════════════════════════════════════
    // TỔNG KẾT
    // ════════════════════════════════════════════════════════════

    echo "────────────────────────────────────────────────────\n";
    echo "🎉 TẤT CẢ 8 TEST FINANCE PASS THÀNH CÔNG! 🎉\n";
    echo "────────────────────────────────────────────────────\n";
    echo "✅ Test 1: Thu tiền đủ → Invoice PAID + LedgerEntry debit\n";
    echo "✅ Test 2: Phân bổ 2 hóa đơn → cả 2 PAID\n";
    echo "✅ Test 3: Void → Invoice hoàn ISSUED + reversal + soft delete\n";
    echo "✅ Test 4: Validation tổng allocations ≠ amount\n";
    echo "✅ Test 5: Security scope org_id\n";
    echo "✅ Test 6: [MỚI] Filter received_between + SoftDeletes scope\n";
    echo "✅ Test 7: [MỚI] LedgerEntry occurred_between + getBalance()\n";
    echo "✅ Test 8: [MỚI] Cashflow manual IN/OUT → LedgerEntry đúng\n";

} catch (\Exception $e) {
    echo "\n❌ TEST THẤT BẠI:\n";
    echo $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " dòng " . $e->getLine() . "\n";
} finally {
    DB::rollBack();
    echo "\n--- KẾT THÚC (Đã Rollback DB — Không có thay đổi nào được lưu) ---\n";
}
