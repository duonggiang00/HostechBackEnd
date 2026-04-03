<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PaymentRelatedTablesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Lấy dữ liệu cơ sở ngẫu nhiên
        $org = DB::table('orgs')->inRandomOrder()->first();

        if (!$org) {
            $this->command->warn('Chưa có dữ liệu ở bảng orgs. Bỏ qua seed thanh toán.');
            return;
        }

        $property = DB::table('properties')->where('org_id', $org->id)->inRandomOrder()->first();
        $user = DB::table('users')->where('org_id', $org->id)->inRandomOrder()->first();
        $invoice = DB::table('invoices')->where('org_id', $org->id)->inRandomOrder()->first();

        // 1. Fake 1 khoản thanh toán (Payment)
        $paymentAmount = $invoice ? $invoice->total_amount : 5000000.00;
        $paymentId = Str::uuid();

        DB::table('payments')->insert([
            'id' => $paymentId,
            'org_id' => $org->id,
            'property_id' => $property ? $property->id : null,
            'payer_user_id' => $user ? $user->id : null,
            'received_by_user_id' => $user ? $user->id : null,
            'method' => 'TRANSFER',
            'amount' => $paymentAmount,
            'reference' => 'CK TIEN NHA THANG NAY',
            'received_at' => Carbon::now(),
            'status' => 'APPROVED',
            'approved_by_user_id' => $user ? $user->id : null,
            'approved_at' => Carbon::now(),
            'note' => 'Thanh toán tiền nhà và dịch vụ',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // 2. Fake 1 bút toán sổ cái (Ledger Entry) liên quan tới Payment bên trên
        $ledgerId = Str::uuid();
        DB::table('ledger_entries')->insert([
            'id' => $ledgerId,
            'org_id' => $org->id,
            'ref_type' => 'payment',
            'ref_id' => $paymentId,
            'debit' => $paymentAmount,
            'credit' => 0.00,
            'occurred_at' => Carbon::now(),
            'created_at' => Carbon::now(),
        ]);

        // 3. Fake 1 biên lai / uỷ nhiệm chi (Receipt) đính kèm
        DB::table('receipts')->insert([
            'id' => Str::uuid(),
            'org_id' => $org->id,
            'payment_id' => $paymentId,
            'path' => 'receipts/' . date('Y/m') . '/' . $paymentId . '_receipt.png',
            'sha256' => hash('sha256', random_bytes(10)),
            'created_at' => Carbon::now(),
        ]);

        // 4. Fake phân bổ thanh toán (Payment Allocation)
        // Nếu có invoice thì phân bổ số tiền thanh toán vào hoá đơn này
        if ($invoice) {
            DB::table('payment_allocations')->insert([
                'id' => Str::uuid(),
                'org_id' => $org->id,
                'payment_id' => $paymentId,
                'invoice_id' => $invoice->id,
                'amount' => $paymentAmount,
                'created_at' => Carbon::now(),
            ]);

            // Cập nhật lại số tiền đã thanh toán của hoá đơn
            DB::table('invoices')->where('id', $invoice->id)->update([
                'paid_amount' => DB::raw("paid_amount + {$paymentAmount}"),
                'status' => 'PAID', // Giả sử đã thanh toán đủ
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}
