<?php

use App\Models\Service\Service;
use App\Models\Property\Room;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$services = Service::whereIn('code', ['DIEN', 'NUOC'])->get();
foreach ($services as $service) {
    echo "Service: " . $service->code . ", Price: " . $service->price . "\n";
}

$room = Room::with('roomServices.service')->first();
if ($room) {
    echo "Room " . $room->code . " services:\n";
    foreach ($room->roomServices as $rs) {
        echo " - " . $rs->service?->code . "\n";
    }
}
