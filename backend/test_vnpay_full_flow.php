<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Invoice\Invoice;
use App\Models\Finance\Payment;
use App\Http\Controllers\Api\Finance\VNPayController;
use App\Services\Finance\VNPayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Request::capture());

echo "Active Database: " . DB::connection()->getDatabaseName() . "\n";
echo "--- VNPay Full Flow Test ---\n";


// 1. Find an existing invoice and reset it for testing
$invoice = Invoice::first();
if (!$invoice) {
    die("No invoice found in database to test with.");
}

// Reset invoice to ISSUED for clean test
$invoice->update([
    'status' => 'ISSUED',
    'paid_amount' => 0,
]);


echo "Step 1: Testing with Invoice ID: {$invoice->id} (Status: {$invoice->status})\n";

// 2. Setup Auth User
$user = \App\Models\Org\User::whereHas('roles', function($q) {
    $q->where('name', 'Admin');
})->first() ?: \App\Models\Org\User::first();
\Illuminate\Support\Facades\Auth::login($user);

// 3. Create PENDING Payment via Controller
$payload = [
    'org_id' => $invoice->org_id,
    'property_id' => $invoice->property_id,
    'payer_user_id' => $user->id,
    'method' => 'QR',
    'amount' => $invoice->total_amount,
    'bank_code' => 'NCB',
    'allocations' => [
        ['invoice_id' => $invoice->id, 'amount' => $invoice->total_amount]
    ]
];

$request = App\Http\Requests\Finance\StorePaymentRequest::create('/api/finance/vnpay/create', 'POST', $payload);
$request->setUserResolver(fn() => $user);
$request->setContainer(app())->setRedirector(app()->make(Illuminate\Routing\Redirector::class));
$request->validateResolved(); // This initializes the validated data

app()->instance(App\Http\Requests\Finance\StorePaymentRequest::class, $request);


/** @var VNPayController $controller */
$controller = app(VNPayController::class);

echo "Step 2: Generating Pending Payment...\n";
$response = $controller->createPayment($request);
$resData = $response->getData(true);

if (!isset($resData['payment_url'])) {
    die("Error creating payment: " . print_r($resData, true));
}

$paymentId = $resData['data']['id'];
$paymentUrl = $resData['payment_url'];
echo "Payment Created: {$paymentId}\n";

echo "URL: {$paymentUrl}\n";

// 4. Simulate IPN Success
echo "Step 3: Simulating IPN Success...\n";

// Build fake parameters that VNPay would send back
$vnpParams = [
    'vnp_TmnCode' => config('vnpay.tmn_code'),
    'vnp_Amount' => (int)($invoice->total_amount * 100),
    'vnp_Command' => 'pay',
    'vnp_CreateDate' => now()->format('YmdHis'),
    'vnp_CurrCode' => 'VND',
    'vnp_IpAddr' => '127.0.0.1',
    'vnp_Locale' => 'vn',
    'vnp_OrderInfo' => 'Thanh toan hoa don ' . $paymentId,
    'vnp_OrderType' => 'billpayment',
    'vnp_ReturnUrl' => config('vnpay.return_url'),
    'vnp_TxnRef' => $paymentId,
    'vnp_Version' => '2.1.0',
    'vnp_ResponseCode' => '00',
    'vnp_TransactionNo' => 'VNP' . time(),
    'vnp_BankCode' => 'NCB',
    'vnp_PayDate' => now()->format('YmdHis'),
    'vnp_TransactionStatus' => '00',
];

ksort($vnpParams);
$queryString = http_build_query($vnpParams);
$vnp_SecureHash = strtoupper(hash_hmac('sha512', $queryString, config('vnpay.hash_secret')));
$vnpParams['vnp_SecureHash'] = $vnp_SecureHash;

$ipnRequest = Request::create('/api/finance/vnpay/ipn', 'GET', $vnpParams);
app()->instance(Request::class, $ipnRequest);

try {
    $ipnResponse = $controller->handleIpn($ipnRequest);
    $ipnResData = $ipnResponse->getData(true);
    echo "IPN Response: " . json_encode($ipnResData) . "\n";
} catch (\Exception $e) {
    echo "IPN ERROR: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    die();
}

// 5. Verify Results
echo "Step 4: Verifying results...\n";
$payment = Payment::find($paymentId);
$invoice = Invoice::find($invoice->id);

echo "Payment Status: {$payment->status} (Expected: APPROVED)\n";
echo "Payment Provider Status: {$payment->provider_status} (Expected: SUCCESS)\n";
echo "Invoice Status: {$invoice->status} (Expected: PAID)\n";
echo "Invoice Paid Amount: {$invoice->paid_amount} (Expected: {$invoice->total_amount})\n";

$ledgerExists = DB::table('ledger_entries')->where('ref_id', $paymentId)->exists();
echo "Ledger Entry Created: " . ($ledgerExists ? 'YES' : 'NO') . " (Expected: YES)\n";


if ($payment->status === 'APPROVED' && $invoice->status === 'PAID' && $ledgerExists) {
    echo "\n🏆 ALL TESTS PASSED!\n";
} else {
    echo "\n❌ TEST FAILED.\n";
}
