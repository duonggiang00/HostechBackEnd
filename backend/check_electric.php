<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

foreach (\App\Models\Service\Service::where('type', 'ELECTRIC')->get() as $s) {
    echo "Name: {$s->name}, ID: {$s->id}, Org: {$s->org_id}\n";
}
