<?php

use App\Models\Service\Service;
use App\Models\Property\Room;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "--- SERVICE PRICES ---\n";
$services = Service::whereIn('code', ['DIEN', 'NUOC'])->get();
foreach ($services as $service) {
    echo "Service: " . $service->code . " | Price: " . number_format($service->current_price) . " VND\n";
}

echo "\n--- MANDATORY SERVICES CHECK ---\n";
$rooms = Room::with('roomServices.service')->take(5)->get();
foreach ($rooms as $room) {
    $codes = $room->roomServices->pluck('service.code')->toArray();
    echo "Room " . $room->code . ": " . implode(', ', $codes) . "\n";
}
