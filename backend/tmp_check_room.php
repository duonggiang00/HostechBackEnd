<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Property\Room;

$room = Room::where('code', 'P10491')
    ->orWhere('name', 'P10491')
    ->with(['contracts' => function($q) {
        $q->where('status', 'ACTIVE');
    }])
    ->first();

if ($room) {
    echo json_encode([
        'id' => $room->id,
        'code' => $room->code,
        'name' => $room->name,
        'status' => $room->status,
        'has_active_contract' => $room->contracts->isNotEmpty(),
        'contract_ids' => $room->contracts->pluck('id')->toArray()
    ], JSON_PRETTY_PRINT);
} else {
    echo "ROM_NOT_FOUND";
}
