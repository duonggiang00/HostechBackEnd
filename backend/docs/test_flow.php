<?php

use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Contract\ContractService;
use App\Services\Invoice\InvoiceService;
use App\Enums\ContractStatus;
use App\Enums\InvoiceItemType;
use Illuminate\Support\Facades\DB;

try {
    echo "--- BẮT ĐẦU TEST LUỒNG HỢP ĐỒNG ---\n";
    DB::beginTransaction();

    // 1. Setup mock data
    $admin = User::firstOrCreate(['email' => 'admin_test@example.com'], [
        'full_name' => 'Admin Test',
        'phone' => '0987654321',
        'password' => bcrypt('password'),
    ]);

    $tenant = User::firstOrCreate(['email' => 'tenant_test@example.com'], [
        'full_name' => 'Tenant Test',
        'phone' => '0123456789',
        'password' => bcrypt('password'),
    ]);

    $org = Org::firstOrCreate(['name' => 'Org Test']);

    $property = Property::firstOrCreate(
        ['org_id' => $org->id, 'name' => 'Property Test'],
        ['address' => '123 Test St']
    );

    $room = Room::firstOrCreate(
        ['org_id' => $org->id, 'property_id' => $property->id, 'name' => 'Room 101'],
        ['code' => 'R101', 'status' => 'AVAILABLE']
    );

    $contractService = app(ContractService::class);
    $invoiceService = app(InvoiceService::class);

    // 2. Admin tạo Hợp đồng (gán Tenant chờ ký)
    echo "1. Tạo Hợp đồng...\n";
    $contractData = [
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'start_date' => now()->format('Y-m-d'),
        'rent_price' => 5000000, // 5 triệu
        'deposit_amount' => 5000000, // Cọc 1 tháng
        'members' => [
            [
                'user_id' => $tenant->id,
                'full_name' => $tenant->full_name,
                'role' => 'TENANT',
                'is_primary' => true,
            ]
        ]
    ];

    $contract = $contractService->create($contractData, $admin);

    if ($contract->status !== ContractStatus::PENDING_SIGNATURE->value) {
        throw new Exception("LỖI: Hợp đồng không ở trạng thái PENDING_SIGNATURE! Hiện tại: {$contract->status}");
    }
    echo "✅ Hợp đồng tạo thành công, trạng thái: PENDING_SIGNATURE\n";

    // 3. Tenant xác nhận ký hợp đồng
    echo "2. Tenant xác nhận ký...\n";
    $acceptResult = $contractService->acceptSignature($contract, $tenant);
    if (!$acceptResult) {
        throw new Exception("LỖI: Không thể acceptSignature!");
    }

    $contract->refresh();
    if ($contract->status !== ContractStatus::PENDING_PAYMENT->value) {
        throw new Exception("LỖI: Hợp đồng không chuyển sang PENDING_PAYMENT! Hiện tại: {$contract->status}");
    }
    echo "✅ Xác nhận ký thành công, trạng thái HĐ: PENDING_PAYMENT\n";

    // 4. Kiểm tra Hóa đơn ban đầu được tạo
    echo "3. Kiểm tra Hóa đơn ban đầu...\n";
    $initialInvoice = Invoice::with('items')->where('contract_id', $contract->id)->first();

    if (!$initialInvoice) {
        throw new Exception("LỖI: Không tìm thấy Hóa đơn ban đầu!");
    }

    $snapshot = $initialInvoice->snapshot;
    if (!isset($snapshot['is_initial']) || $snapshot['is_initial'] !== true) {
        throw new Exception("LỖI: Hóa đơn không có đánh dấu is_initial trong snapshot!");
    }

    if ($initialInvoice->status !== 'ISSUED') {
        throw new Exception("LỖI: Trạng thái hóa đơn không phải ISSUED! Hiện tại: {$initialInvoice->status}");
    }

    if ($initialInvoice->total_amount != 10000000) {
        throw new Exception("LỖI: Tổng tiền hóa đơn không đúng (kỳ vọng 10,000,000)! Hiện tại: {$initialInvoice->total_amount}");
    }

    if ($initialInvoice->items->count() !== 2) {
        throw new Exception("LỖI: Thiếu items trong hóa đơn! Số lượng: " . $initialInvoice->items->count());
    }

    echo "✅ Hóa đơn tạo thành công. ID: {$initialInvoice->id}, Trạng thái: {$initialInvoice->status}, Tổng tiền: {$initialInvoice->total_amount}\n";

    // 5. Admin xác nhận thanh toán hóa đơn
    echo "4. Admin thanh toán hóa đơn...\n";
    $invoiceService->payInvoice($initialInvoice, 'Khách đã chuyển khoản');

    $initialInvoice->refresh();
    if ($initialInvoice->status !== 'PAID') {
        throw new Exception("LỖI: Trạng thái hóa đơn chưa chuyển thành PAID!");
    }
    echo "✅ Thanh toán Hóa đơn thành công.\n";

    // 6. Kiểm tra lại Hợp đồng tự động Active
    $contract->refresh();
    if ($contract->status !== ContractStatus::ACTIVE->value) {
        throw new Exception("LỖI: Hợp đồng không tự động chuyển ACTIVE sau khi thanh toán hóa đơn! Hiện tại: {$contract->status}");
    }
    if (is_null($contract->signed_at)) {
        throw new Exception("LỖI: Hợp đồng chưa được đặt signed_at!");
    }
    echo "✅ Hợp đồng tự động kích hoạt thành ACTIVE. Signed_at: {$contract->signed_at}\n";

    echo "\n🎉 TẤT CẢ TEST PASS THÀNH CÔNG! 🎉\n";

} catch (Exception $e) {
    echo "❌ TEST THẤT BẠI:\n" . $e->getMessage() . "\n";
} finally {
    // Rollback để dọn data test
    DB::rollBack();
    echo "--- KẾT THÚC (Đã Rollback DB) ---\n";
}