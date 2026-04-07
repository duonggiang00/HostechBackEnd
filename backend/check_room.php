<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Property\Room;

$roomName = 'P10491';
$room = Room::where('name', $roomName)->orWhere('code', $roomName)->first();

if ($room) {
    echo "ID: " . $room->id . "\n";
    echo "Property ID: " . $room->property_id . "\n";
    echo "Name: " . $room->name . "\n";
    echo "Code: " . $room->code . "\n";
    echo "Status in DB: " . $room->status . "\n";
    $contracts = $room->contracts()
        ->whereIn('status', ['ACTIVE', 'PENDING_PAYMENT'])
        ->get();
    echo "Active/Pending Contracts count: " . $contracts->count() . "\n";
    foreach ($contracts as $contract) {
        echo " - Contract ID: " . $contract->id . ", Status: " . $contract->status . ", Tenant: " . ($contract->getTenantNameAttribute() ?? 'N/A') . "\n";
    }
} else {
    echo "Room $roomName not found.\n";
}
