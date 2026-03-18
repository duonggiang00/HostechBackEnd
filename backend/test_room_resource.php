<?php

use App\Models\Property\Room;
use App\Http\Resources\Property\RoomResource;
use Illuminate\Support\Facades\Log;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$room = Room::with(['meters.latestReading'])->first();

if (!$room) {
    echo "No room found.\n";
    exit(1);
}

$resource = new RoomResource($room);
$data = $resource->resolve();

echo "Room Code: " . $data['code'] . "\n";
echo "Electricity Reading: " . ($data['electricity_reading'] ?? 'N/A') . "\n";
echo "Water Reading: " . ($data['water_reading'] ?? 'N/A') . "\n";

if (isset($data['meters'])) {
    foreach ($data['meters'] as $meter) {
        echo "Meter Type: " . $meter['type'] . ", Code: " . $meter['code'] . "\n";
    }
}
