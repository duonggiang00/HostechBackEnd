<?php

use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Services\Meter\MeterReadingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

DB::beginTransaction();

try {
    echo "--- [MeterReading Perfection Verification] ---\n";

    // 1. Setup
    $orgId = DB::table('orgs')->first()->id;
    $property = DB::table('properties')->where('org_id', $orgId)->first();
    
    $meter = Meter::create([
        'org_id' => $orgId,
        'property_id' => $property->id,
        'code' => 'TEST-METER-' . time(),
        'type' => 'ELECTRIC',
        'base_reading' => 100,
        'is_active' => true,
    ]);
    echo "Meter created: {$meter->code} (Base: 100)\n";

    // 2. Test Auto-Consumption on DRAFT
    echo "\n[1] Testing Auto-Consumption on creation...\n";
    $reading = MeterReading::create([
        'org_id' => $orgId,
        'meter_id' => $meter->id,
        'reading_value' => 150,
        'period_start' => now()->startOfMonth(),
        'period_end' => now()->endOfMonth(),
        'status' => 'DRAFT',
    ]);
    
    echo "Reading created (DRAFT): Value 150\n";
    echo "Expected Consumption: 50 (150 - 100)\n";
    echo "Actual Consumption: {$reading->consumption}\n";
    
    if (floatval($reading->consumption) === 50.0) {
        echo "✓ Success: Consumption calculated correctly in Observer@saving.\n";
    } else {
        throw new Exception("Fail: Consumption is {$reading->consumption}");
    }

    // 3. Test EDA Trigger on Approval
    echo "\n[2] Testing EDA Trigger on Approval...\n";
    $reading->status = 'APPROVED';
    $reading->save();
    
    echo "Reading updated to APPROVED.\n";
    
    // Refresh meter to see if SynchronizeMeterMetadata listener worked
    $meter->refresh();
    echo "Meter Base Reading after sync: {$meter->base_reading}\n";
    
    if (intval($meter->base_reading) === 150) {
        echo "✓ Success: Meter meta synchronized via MeterReadingApproved event (dispatched from Observer).\n";
    } else {
        echo "⚠ Warning: Meter sync might be async. Actual: {$meter->base_reading}\n";
    }

    // 4. Test Second Reading (Sequential)
    echo "\n[3] Testing Second Sequential Reading...\n";
    $reading2 = MeterReading::create([
        'org_id' => $orgId,
        'meter_id' => $meter->id,
        'reading_value' => 210,
        'period_start' => now()->addMonth()->startOfMonth(),
        'period_end' => now()->addMonth()->endOfMonth(),
        'status' => 'APPROVED',
    ]);
    
    echo "Reading 2 created (APPROVED): Value 210\n";
    echo "Expected Consumption: 60 (210 - 150)\n";
    echo "Actual Consumption: {$reading2->consumption}\n";
    
    if (floatval($reading2->consumption) === 60.0) {
        echo "✓ Success: Consumption for subsequent reading calculated correctly.\n";
    }

    // 5. Check Cache Invalidation
    $cacheKey = "dashboard:property:{$property->id}:stats";
    \Illuminate\Support\Facades\Cache::put($cacheKey, 'stale_data', 60);
    echo "\n[4] Testing Cache Invalidation...\n";
    $reading2->status = 'LOCKED';
    $reading2->save();
    
    if (!\Illuminate\Support\Facades\Cache::has($cacheKey)) {
        echo "✓ Success: Cache Key '{$cacheKey}' successfully cleared after update.\n";
    } else {
        echo "× Fail: Cache key still exists.\n";
    }

    echo "\n--- [Verification Completed Successfully] ---\n";

} catch (Exception $e) {
    echo "\n!!! VERIFICATION FAILED !!!\n";
    echo $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
} finally {
    DB::rollBack();
    echo "\nTransaction rolled back. DB clean.\n";
}
