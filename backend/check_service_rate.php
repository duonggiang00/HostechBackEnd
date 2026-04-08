<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$service = \App\Models\Service\Service::where('type', 'ELECTRIC')->first();
if ($service) {
    echo "Service Name: {$service->name}\n";
    $currentRate = $service->currentRate;
    if ($currentRate) {
        echo "Current Rate ID: {$currentRate->id}, Price: {$currentRate->price}\n";
        $currentRate->loadMissing('tieredRates');
        echo "Tiered Rates Count: {$currentRate->tieredRates->count()}\n";
        foreach ($currentRate->tieredRates as $tier) {
            echo " - Tier From: {$tier->tier_from}, Tier To: " . ($tier->tier_to === null ? 'NULL' : $tier->tier_to) . ", Price: {$tier->price}\n";
        }
        
        $usage = 100;
        $totalAmount = 0;
        if ($currentRate->tieredRates->count() > 0) {
            $remainingUsage = $usage;
            foreach ($currentRate->tieredRates as $tier) {
                $tierLimit = ($tier->tier_to === null) ? PHP_INT_MAX : ($tier->tier_to - $tier->tier_from);
                $amountInTier = min($remainingUsage, $tierLimit);

                if ($amountInTier > 0) {
                    $tierCost = $amountInTier * $tier->price;
                    $totalAmount += $tierCost;
                    echo "   Adding Tier Cost: {$tierCost}\n";
                    $remainingUsage -= $amountInTier;
                }
                if ($remainingUsage <= 0) {
                    break;
                }
            }
        } else {
            $totalAmount = $usage * (float) $currentRate->price;
        }
        echo "Calculated Total Amount: {$totalAmount}\n";
    } else {
        echo "No current rate found.\n";
    }
} else {
    echo "No ELECTRIC service found.\n";
}
