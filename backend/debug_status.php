<?php
use App\Models\Contract\Contract;
use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$contract = Contract::first();
if ($contract) {
    echo "Current Status (Enum): " . ($contract->status instanceof ContractStatus ? $contract->status->value : gettype($contract->status)) . "\n";
    echo "Current Status (Raw DB): " . DB::table('contracts')->where('id', $contract->id)->value('status') . "\n";
}
