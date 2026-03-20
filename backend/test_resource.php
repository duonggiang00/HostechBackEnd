<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Contract\Contract;
use App\Http\Resources\Contract\ContractResource;
use Illuminate\Http\Request;

$contract = Contract::first();
if (!$contract) {
    echo "No contracts found in database.\n";
    exit;
}

$resource = new ContractResource($contract);
$data = $resource->resolve();

echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
