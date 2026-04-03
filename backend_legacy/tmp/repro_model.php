<?php

use App\Features\Org\Models\User;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

DB::enableQueryLog();

echo "Environment: " . app()->environment() . "\n";
echo "DB Default: " . config('database.default') . "\n";
echo "DB Database: " . config('database.connections.' . config('database.default') . '.database') . "\n";

$pdo = DB::connection()->getPdo();
$fetchMode = $pdo->getAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE);
$fetchModes = [
    \PDO::FETCH_ASSOC => 'PDO::FETCH_ASSOC',
    \PDO::FETCH_OBJ => 'PDO::FETCH_OBJ',
    \PDO::FETCH_BOTH => 'PDO::FETCH_BOTH',
    \PDO::FETCH_NUM => 'PDO::FETCH_NUM',
    \PDO::FETCH_CLASS => 'PDO::FETCH_CLASS',
];
echo "Default PDO Fetch Mode: " . ($fetchModes[$fetchMode] ?? $fetchMode) . "\n";

echo "\nChecking User model hydration...\n";
try {
    $meter = \App\Features\Meter\Models\Meter::withoutGlobalScopes()->first();
    if ($meter) {
        echo "Class of first meter: " . get_class($meter) . "\n";
        echo "Is instance of Eloquent Model? " . ($meter instanceof \Illuminate\Database\Eloquent\Model ? 'Yes' : 'No') . "\n";
    } else {
        echo "No meters found in database.\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

$queries = DB::getQueryLog();
echo "\nExecuted Queries:\n";
print_r($queries);
