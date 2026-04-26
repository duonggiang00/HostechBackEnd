<?php

use App\Models\Finance\Payment;
use App\Models\Finance\PaymentStatusHistory;
use App\Models\Org\Org;
use App\Models\Property\Property;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

function verifyPaymentEDA() {
    echo "--- Verifying Payment Observer Auditing & EDA ---\n";

    // 1. Setup mock data
    $org = Org::first();
    $property = Property::where('org_id', $org->id)->first();
    
    if (!$org || !$property) {
        echo "Error: No Org or Property found to test.\n";
        return;
    }

    echo "Using Org: {$org->name} ({$org->id})\n";

    // 2. Test Created Auditing
    echo "\n[1] Testing 'created' Auditing...\n";
    $payment = Payment::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'method' => 'CASH',
        'amount' => 100000,
        'status' => 'PENDING',
        'note' => 'Test payment creation'
    ]);

    $history = PaymentStatusHistory::where('payment_id', $payment->id)->first();
    if ($history && $history->to_status === 'PENDING') {
        echo "✓ Success: Initial status PENDING recorded in history.\n";
    } else {
        echo "✗ Failure: Initial status history not found.\n";
    }

    // 3. Test Updated Auditing
    echo "\n[2] Testing 'updated' Auditing (APPROVED)...\n";
    $payment->status_history_note = 'Approved by automation test';
    $payment->update(['status' => 'APPROVED']);

    $latestHistory = PaymentStatusHistory::where('payment_id', $payment->id)
        ->orderBy('created_at', 'desc')
        ->first();

    if ($latestHistory && $latestHistory->to_status === 'APPROVED' && $latestHistory->from_status === 'PENDING') {
        echo "✓ Success: Transition PENDING -> APPROVED recorded.\n";
        if ($latestHistory->note === 'Approved by automation test') {
            echo "✓ Success: Custom note captured.\n";
        } else {
            echo "✗ Failure: Note not captured. Found: '{$latestHistory->note}'\n";
        }
    } else {
        echo "✗ Failure: Update status history not found correctly.\n";
    }

    // 4. Test Cache Invalidation Check
    echo "\n[3] Testing Cache Invalidation...\n";
    // Setup a dummy cache key
    $cacheKey = "dashboard:property:{$property->id}:stats";
    DB::table('cache')->updateOrInsert(['key' => $cacheKey], ['value' => 'old_data', 'expiration' => time() + 3600]);
    
    echo "Dummy cache key created: $cacheKey\n";
    
    // Trigger update again to clear cache
    $payment->update(['amount' => 120000]);
    
    $exists = DB::table('cache')->where('key', $cacheKey)->exists();
    if (!$exists) {
        echo "✓ Success: Cache key successfully cleared after payment update.\n";
    } else {
        echo "✗ Failure: Cache key still exists.\n";
    }

    // 5. Cleanup
    $payment->forceDelete();
    echo "\n--- Verification Complete ---\n";
}

verifyPaymentEDA();
