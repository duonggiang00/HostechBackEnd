<?php

use App\Models\Contract\Contract;
use App\Models\Org\Org;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Invoice\Invoice;
use App\Services\Contract\ContractService;
use App\Enums\ContractStatus;
use Illuminate\Support\Facades\DB;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    DB::beginTransaction();
    $org = Org::factory()->create();
    $property = Property::factory()->create(['org_id' => $org->id]);
    $room = Room::factory()->create([
        'property_id' => $property->id,
        'org_id' => $org->id,
        'status' => 'occupied'
    ]);

    $contract = Contract::factory()->create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'security_deposit' => 2000000,
        'status' => ContractStatus::ACTIVE,
    ]);

    echo "Creating Invoice...\n";
    $invoice = Invoice::create([
        'org_id' => $org->id,
        'property_id' => $property->id,
        'room_id' => $room->id,
        'contract_id' => $contract->id,
        'tenant_id' => $contract->tenant_id,
        'total_amount' => 2500000,
        'status' => 'unpaid',
        'due_date' => now()->subDays(5),
        'invoice_date' => now()->subDays(10),
        'period_start' => now()->subDays(30),
        'period_end' => now(),
    ]);

    echo "Contract ID: " . $contract->id . "\n";
    echo "Contract Status: " . $contract->status->value . "\n";
    echo "Deposit: " . $contract->security_deposit . "\n";
    echo "Invoice Amount: " . $invoice->total_amount . "\n";

    $service = app(ContractService::class);
    echo "Running processDebtBreachTerminations...\n";
    
    // Check if contract is found correctly
    $testContracts = Contract::where('status', ContractStatus::ACTIVE)
            ->with(['invoices' => function($q) { $q->where('status', 'unpaid'); }])
            ->where('id', $contract->id)
            ->get();
    
    echo "Contracts found including target: " . $testContracts->count() . "\n";
    foreach($testContracts as $tc) {
        $debt = $tc->invoices->sum('total_amount');
        echo " - Contract " . $tc->id . " debt: " . $debt . "\n";
    }

    $service->processDebtBreachTerminations();

    $contract->refresh();
    echo "Contract Final Status: " . $contract->status->value . "\n";

    DB::rollBack();
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    DB::rollBack();
}
