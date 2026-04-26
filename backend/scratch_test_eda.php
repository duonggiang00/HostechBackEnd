<?php

use App\Models\Property\Room;
use App\Events\Property\RoomCreated;
use App\Models\Org\User;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "Testing Event-Driven Room Creation...\n";

$performer = User::whereHas('roles', function($q){ $q->where('name', 'Admin'); })->first();
if (!$performer) {
    echo "No Admin user found for testing.\n";
    exit(1);
}

$roomData = [
    'property_id' => \App\Models\Property\Property::first()->id,
    'floor_id' => \App\Models\Property\Floor::first()->id,
    'name' => 'Test Room EDA ' . time(),
    'code' => 'TEST-' . time(),
    'status' => 'available',
    'base_price' => 1000000,
];

echo "1. Creating Room via RoomService...\n";
$service = app(\App\Services\Property\RoomService::class);
$room = $service->create($roomData, $performer);

echo "Room Created: {$room->id}\n";

echo "2. Checking if services were attached by listener...\n";
$servicesCount = $room->roomServices()->count();
echo "Room Services count: {$servicesCount}\n";

if ($servicesCount > 0) {
    echo "SUCCESS: Listener InitializeRoomServices triggered correctly.\n";
} else {
    echo "FAILED: No services attached. Check AppServiceProvider registration.\n";
}

// Cleanup
$room->forceDelete();
echo "Test Finished.\n";
