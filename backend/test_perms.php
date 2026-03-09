<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = App\Models\Org\User::where('email', 'chung-danh-and-khuat_manager@example.com')->first();
if (!$user) { echo "User not found\n"; exit; }
$perms = $user->getAllPermissions()->pluck('name')->toArray();
echo "MANAGER PERMS:\n";
foreach($perms as $p) {
    if (strpos($p, 'Properties') !== false || strpos($p, 'Rooms') !== false || strpos($p, 'Floors') !== false) {
        echo "- $p\n";
    }
}

$user2 = App\Models\Org\User::where('email', 'chung-danh-and-khuat_staff@example.com')->first();
if (!$user2) { echo "User2 not found\n"; exit; }
$perms2 = $user2->getAllPermissions()->pluck('name')->toArray();
echo "\nSTAFF PERMS:\n";
foreach($perms2 as $p) {
    if (strpos($p, 'Properties') !== false || strpos($p, 'Rooms') !== false || strpos($p, 'Floors') !== false) {
        echo "- $p\n";
    }
}
