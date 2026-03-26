<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Invoice\Invoice;
use App\Models\Finance\Payment;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

echo "--- STARTING VNPAY INTEGRATION TEST ---\n\n";

// Bọc toàn bộ quá trình test vào Transaction để tự động xóa sạch Data sau khi chạy xong
DB::beginTransaction();

try {
    echo "1. Setup mock data...\n";
    // Cần tạo Org, User, Property trước để truyền tường minh ID, tránh lỗi Factory cascade thiếu org_id
    $org = \App\Models\Org\Org::factory()->create();
    $user = \App\Models\Org\User::factory()->create(['org_id' => $org->id]);
    $property = \App\Models\Property\Property::factory()->create(['org_id' => $org->id]);
    $room = \App\Models\Property\Room::factory()->create(['org_id' => $org->id, 'property_id' => $property->id]);
    
    // Tạo 1 contract mẫu cho room (vì Invoice thường yêu cầu contract_id)
    $contract = \App\Models\Contract\Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
    ]);

    $invoice = Invoice::factory()->create([
        'org_id'         => $org->id,
        'property_id'    => $property->id,
        'room_id'        => $room->id,
        'contract_id'    => $contract->id,
        'status'         => 'ISSUED',
        'paid_amount'    => 0,
        'total_amount'   => 5000000,
    ]);

    echo "   [SUCCESS] Created Mock Invoice ID: {$invoice->id}\n";
    echo "   [SUCCESS] Status: {$invoice->status}, Paid Amount: {$invoice->paid_amount}\n\n";

    echo "2. Override VNPay config...\n";
    config(['vnpay.tmn_code' => 'TEST_TMN']);
    config(['vnpay.hash_secret' => 'SECRET1234567890SECRET']);

    echo "3. Testing Payment Service (Create VNPAY PENDING & Create URL)\n";
    $paymentService = app(\App\Services\Finance\PaymentService::class);
    $data = [
        'org_id' => $org->id,
        'property_id' => $property->id,
        'payer_user_id' => $user->id,
        'method' => 'QR',
        'amount' => 5000000,
        'note' => 'Test VNPay',
        'allocations' => [
            ['invoice_id' => $invoice->id, 'amount' => 5000000]
        ]
    ];
    
    $payment = $paymentService->createPending($data, $user);
    $vnpayService = app(\App\Services\Finance\VNPayService::class);
    $paymentUrl = $vnpayService->buildPaymentUrl($payment, '127.0.0.1', 'NCB');

    echo "   [SUCCESS] Created Payment ID: {$payment->id}\n";
    echo "   [SUCCESS] Payment Status: {$payment->status}\n";
    echo "   [SUCCESS] Payment URL: {$paymentUrl}\n\n";

    // 2.b Giả lập IPN Webhook (Payload VNPay gửi về)
    $params = [
        'vnp_Version' => '2.1.0',
        'vnp_Command' => 'pay',
        'vnp_TmnCode' => 'TEST_TMN',
        'vnp_Amount' => 5000000 * 100,
        'vnp_BankCode' => 'NCB',
        'vnp_BankTranNo' => 'VNP12345',
        'vnp_CardType' => 'ATM',
        'vnp_PayDate' => now()->format('YmdHis'),
        'vnp_OrderInfo' => 'Thanh toan test',
        'vnp_TransactionNo' => 'VNP_99999999',
        'vnp_ResponseCode' => '00',
        'vnp_TransactionStatus' => '00',
        'vnp_TxnRef' => $payment->id,
    ];

    ksort($params);
    $queryString = http_build_query($params);
    $secureHash = strtoupper(hash_hmac('sha512', $queryString, config('vnpay.hash_secret')));
    $params['vnp_SecureHash'] = $secureHash;

    // Simulate Request
    $request = \Illuminate\Http\Request::create('/api/finance/vnpay/ipn', 'POST', $params);
    $controller = app(\App\Http\Controllers\Api\Finance\VNPayController::class);
    $response = $controller->handleIpn($request);

    echo "   [WEBHOOK] Called IPN Webhook...\n";
    echo "   [WEBHOOK] Response: " . $response->getContent() . "\n\n";

    // 2.c Kiểm tra lại DB sau webhook
    $payment->refresh();
    $invoice->refresh();

    echo "3. Final Status:\n";
    echo "   Payment Status: {$payment->status} (Expect: APPROVED)\n";
    echo "   Payment Provider Ref: {$payment->provider_ref} (Expect: VNP_99999999)\n";
    echo "   Invoice Status: {$invoice->status} (Expect: PAID)\n";
    echo "   Invoice Paid Amount: {$invoice->paid_amount} (Expect: 5000000)\n\n";

    if ($payment->status === 'APPROVED' && $invoice->status === 'PAID') {
        echo "✅ TEST PASSED ALL CHECKS!\n";
    } else {
        echo "❌ TEST FAILED!\n";
    }

} catch (\Exception $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}

DB::rollBack();
echo "\n--- TEST DONE (Changes rolled back) ---\n";

