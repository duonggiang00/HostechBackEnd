<?php
use App\Features\Property\Models\Property;
use App\Features\Org\Models\User;
use App\Features\Contract\Models\Contract;

echo "Checking User filtering by property_id...\n";
$property = Property::whereHas('contracts')->first() ?? Property::first();
if (!$property) {
    echo "No property found\n";
    exit;
}

echo "Property Name: " . $property->name . "\n";
echo "Property ID: " . $property->id . "\n";
echo "Users count in property_user: " . $property->users()->count() . "\n";
echo "Contracts count for this property: " . $property->contracts()->count() . "\n";

// Count users who are tenants in this property via contracts
$tenantsCount = User::whereHas('contractMembers.contract', function($q) use ($property) {
    $q->where('property_id', $property->id);
})->count();

echo "Tenants in contracts: " . $tenantsCount . "\n";

// Current logic in UserController/UserService
$currentLogicResults = User::whereHas('properties', function($q) use ($property) {
    $q->where('properties.id', $property->id);
})->count();

echo "Results count using current whereHas(properties): " . $currentLogicResults . "\n";

if ($tenantsCount > 0 && $currentLogicResults < ($tenantsCount + $property->users()->count())) {
    echo "\n[CONFIRMED] Current logic MISSES tenants who are not in property_user table.\n";
} else {
    echo "\n[INFO] No tenants found or logic seems to cover more than expected. Check data.\n";
}
