<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$room = \App\Models\Property\Room::whereHas('contracts', function($q) {
    $q->where('status', 'ACTIVE');
})->first();

$roomServices = \App\Models\Service\RoomService::with('service')->where('room_id', $room->id)->get();
echo "Room Services:\n";
foreach ($roomServices as $rs) {
    echo " - Service ID: {$rs->service_id}, Type: {$rs->service->type}, Calc Mode: {$rs->service->calc_mode}, Name: {$rs->service->name}\n";
}
