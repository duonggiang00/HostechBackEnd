<?php

use App\Models\Property\Room;
use App\Models\Property\Property;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$room = Room::first();
if (!$room) {
    die("No room found.");
}

echo "Room ID: " . $room->id . "\n";
echo "Property ID in Room: " . $room->property_id . "\n";

$property = Property::find($room->property_id);
if ($property) {
    echo "Property found: " . $property->name . "\n";
} else {
    echo "Property NOT found in 'properties' table!\n";
    
    // Check if it exists with different case or something
    $exists = Property::where('id', $room->property_id)->exists();
    echo "Exists check (Eloquent): " . ($exists ? 'YES' : 'NO') . "\n";
    
    $rawExists = DB::table('properties')->where('id', $room->property_id)->exists();
    echo "Exists check (DB): " . ($rawExists ? 'YES' : 'NO') . "\n";
}
