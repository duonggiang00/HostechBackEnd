<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$room = \App\Models\Property\Room::whereHas('contracts', function($q) {
    $q->where('status', 'ACTIVE');
})->first();

$contract = $room->contracts()->where('status', 'ACTIVE')->first();
$meters = \App\Models\Meter\Meter::where('room_id', $room->id)->where('is_active', true)->get();

foreach ($meters as $meter) {
    echo " - Meter ID: {$meter->id}, Type: {$meter->type}\n";
    $service = app(\App\Services\Invoice\RecurringBillingService::class);
    $reflection = new ReflectionClass(get_class($service));
    $method = $reflection->getMethod('resolveServiceForMeter');
    $method->setAccessible(true);
    $resolvedService = $method->invokeArgs($service, [$meter, $room->id, $contract->org_id]);
    echo "   Resolved Service: " . ($resolvedService ? $resolvedService->name : 'NULL') . "\n";
}
