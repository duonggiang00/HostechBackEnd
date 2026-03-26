<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

use App\Models\Invoice\Invoice;
use App\Http\Controllers\Api\Finance\VNPayController;
use Illuminate\Http\Request;

$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Request::capture());

echo "--- VNPay Manual Test ---\n";

// 1. Find an invoice
$invoice = Invoice::where('status', 'ISSUED')->first();

if (!$invoice) {
    echo "No ISSUED invoices found. Finding any invoice...\n";
    $invoice = Invoice::first();
}

if (!$invoice) {
    die("No invoices found in database.\n");
}

echo "Testing with Invoice ID: {$invoice->id}\n";
echo "Amount: {$invoice->total_amount}\n";

// 2. Authenticate as an Admin/Manager
$user = \App\Models\Org\User::whereHas('roles', function($q) {
    $q->where('name', 'Admin');
})->first();

if (!$user) {
    $user = \App\Models\Org\User::first();
}

\Illuminate\Support\Facades\Auth::login($user);
echo "Logged in as: {$user->email}\n";

// 3. Mock Request Data for VNPay Controller
$payload = [

    'org_id' => $invoice->org_id,
    'property_id' => $invoice->property_id,
    'payer_user_id' => $user->id,
    'method' => 'QR',
    'amount' => $invoice->total_amount,
    'bank_code' => 'NCB',
    'allocations' => [
        [
            'invoice_id' => $invoice->id,
            'amount' => $invoice->total_amount
        ]
    ]
];

// 3. Inject Request and call controller
$request = App\Http\Requests\Finance\StorePaymentRequest::create('/api/finance/vnpay/create', 'POST', $payload);
$request->setUserResolver(fn() => $user);
$request->setContainer(app()); // Fix for "Call to a member function call() on null"
// Bind both classes to be safe
app()->instance(Illuminate\Http\Request::class, $request);
app()->instance(App\Http\Requests\Finance\StorePaymentRequest::class, $request);



/** @var VNPayController $controller */
$controller = app(VNPayController::class);

try {
    echo "Generating VNPay URL...\n";
    
    // Manually trigger validation to see errors
    try {
        $request->validateResolved();
    } catch (\Illuminate\Validation\ValidationException $ve) {
        echo "VALIDATION FAILED:\n";
        print_r($ve->errors());
        die();
    }

    $response = $controller->createPayment($request);
    $data = $response->getData(true);
    
    if (isset($data['data']['payment_url'])) {
        echo "SUCCESS! VNPay URL:\n";
        echo $data['data']['payment_url'] . "\n";
    } else {
        echo "FAILED to generate URL.\n";
        print_r($data);
    }
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Line: " . $e->getLine() . "\n";
    echo "File: " . $e->getFile() . "\n";
}


