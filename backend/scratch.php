<?php

use App\Models\Contract\Contract;
use App\Services\Contract\TerminationReconciliationService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Validator;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$validator = Validator::make([
    'termination_date' => '2026-05-03',
    'cancellation_party' => 'LANDLORD',
    'cancellation_reason' => 'Quá h?n h?p d?ng',
    'waive_penalty' => 'false',
    'damage_fee_total' => '0',
    'billing_mode' => 'combined',
], [
    'termination_date' => 'nullable|date',
    'damage_fee_total' => 'nullable|numeric|min:0',
    'waive_penalty' => 'nullable|boolean',
    'cancellation_party' => 'nullable|string|in:LANDLORD,TENANT,MUTUAL,SYSTEM',
    'billing_mode' => 'nullable|string|in:combined,split',
    'mid_month_rent_credit' => 'nullable|numeric|min:0',
]);

if ($validator->fails()) {
    echo "Validation failed:\n";
    print_r($validator->errors()->toArray());
} else {
    echo "Validation passed\n";
    // Check TerminationReconciliationService
    try {
        $contract = Contract::find('019de72a-1a81-711f-8426-e6de159ac015');
        if (! $contract) {
            echo "Contract not found\n";
        } else {
            $preview = app(TerminationReconciliationService::class)->preview(
                $contract,
                '2026-05-03',
                $validator->validated()
            );
            echo "Preview success\n";
        }
    } catch (Exception $e) {
        echo 'Exception in service: '.$e->getMessage()."\n";
    }
}
