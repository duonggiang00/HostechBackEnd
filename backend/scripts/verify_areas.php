<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Features\Property\Models\Property;
use App\Features\Property\Models\Room;

$properties = Property::with('floors')->orderBy('created_at', 'desc')->limit(18)->get();
$violationCount = 0;
foreach ($properties as $p) {
    echo "ID: {$p->id}, Property: {$p->name}, Area: {$p->area}, Shared: {$p->shared_area}, Created: {$p->created_at}\n";
    $pViolation = false;
    $available = $p->area - $p->shared_area;
    foreach ($p->floors as $f) {
        $roomsArea = Room::where('floor_id', $f->id)->sum('area');
        if ($roomsArea > $available + 0.01) { // More precision
            echo "  Floor: {$f->name}, Rooms: " . Room::where('floor_id', $f->id)->count() . ", Total Area: {$roomsArea}, Limit: {$available} !!! VIOLATION !!!\n";
            $pViolation = true;
        }
    }
    if ($pViolation) $violationCount++;
}
echo "TOTAL PROPERTIES WITH VIOLATIONS IN LAST 18: $violationCount\n";
