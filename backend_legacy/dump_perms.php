<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$perms = Spatie\Permission\Models\Permission::pluck('name')->toArray();
file_put_contents('perms.json', json_encode($perms, JSON_PRETTY_PRINT));
echo "Saved to perms.json\n";
