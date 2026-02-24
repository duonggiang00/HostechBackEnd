<?php

$basePath = __DIR__;

$replacements = [
    // Models
    'App\Models\Org' => 'App\Models\Org\Org',
    'App\Models\User' => 'App\Models\Org\User',
    'App\Models\Property' => 'App\Models\Property\Property',
    'App\Models\Floor' => 'App\Models\Property\Floor',
    'App\Models\Room' => 'App\Models\Property\Room',
    'App\Models\RoomPhoto' => 'App\Models\Property\RoomPhoto',
    'App\Models\RoomAsset' => 'App\Models\Property\RoomAsset',
    'App\Models\RoomPrice' => 'App\Models\Property\RoomPrice',
    'App\Models\Service' => 'App\Models\Service\Service',
    'App\Models\ServiceRate' => 'App\Models\Service\ServiceRate',
    'App\Models\TieredRate' => 'App\Models\Service\TieredRate',
    'App\Models\RoomService' => 'App\Models\Service\RoomService',
    'App\Models\Contract' => 'App\Models\Contract\Contract',
    'App\Models\ContractMember' => 'App\Models\Contract\ContractMember',
    'App\Models\AuditLog' => 'App\Models\System\AuditLog',

    // Controllers
    'App\Http\Controllers\Api\OrgController' => 'App\Http\Controllers\Api\Org\OrgController',
    'App\Http\Controllers\Api\UserController' => 'App\Http\Controllers\Api\Org\UserController',
    'App\Http\Controllers\Api\PropertyController' => 'App\Http\Controllers\Api\Property\PropertyController',
    'App\Http\Controllers\Api\FloorController' => 'App\Http\Controllers\Api\Property\FloorController',
    'App\Http\Controllers\Api\RoomController' => 'App\Http\Controllers\Api\Property\RoomController',
    'App\Http\Controllers\Api\ServiceController' => 'App\Http\Controllers\Api\Service\ServiceController',
    'App\Http\Controllers\Api\ContractController' => 'App\Http\Controllers\Api\Contract\ContractController',
    'App\Http\Controllers\Api\V1\AuditLogController' => 'App\Http\Controllers\Api\System\AuditLogController',

    // Services
    'App\Services\OrgService' => 'App\Services\Org\OrgService',
    'App\Services\UserService' => 'App\Services\Org\UserService',
    'App\Services\PropertyService' => 'App\Services\Property\PropertyService',
    'App\Services\FloorService' => 'App\Services\Property\FloorService',
    'App\Services\RoomService' => 'App\Services\Property\RoomService',
    'App\Services\ServiceService' => 'App\Services\Service\ServiceService',
    'App\Services\ContractService' => 'App\Services\Contract\ContractService',
];

uksort($replacements, function($a, $b) {
    return strlen($b) - strlen($a);
});

$directories = ['app', 'database', 'tests'];

function scanAllDir($dir) {
    if (!is_dir($dir)) return [];
    $result = [];
    foreach(scandir($dir) as $filename) {
        if ($filename[0] === '.') continue;
        $filePath = $dir . '/' . $filename;
        if (is_dir($filePath)) {
            foreach (scanAllDir($filePath) as $child) {
                $result[] = $child;
            }
        } else {
            if (pathinfo($filePath, PATHINFO_EXTENSION) === 'php') {
                $result[] = $filePath;
            }
        }
    }
    return $result;
}

$files = [];
foreach ($directories as $d) {
    $files = array_merge($files, scanAllDir($basePath . '/' . $d));
}

foreach ($files as $file) {
    $content = file_get_contents($file);
    $changed = false;
    foreach ($replacements as $old => $new) {
        // We look for '\\' + $old immediately, not bounded by lookbehind.
        $escapedOld = preg_quote('\\' . $old, '/');
        // Because we already ran the fix for other cases, this specifically catches the trailing un-renamed classes
        $pattern = '/' . $escapedOld . '(?![a-zA-Z0-9_\\\\])/';
        
        $content = preg_replace_callback($pattern, function($matches) use (&$changed, $new) {
            $changed = true;
            return '\\' . $new;
        }, $content);
    }
    if ($changed) {
        file_put_contents($file, $content);
        echo "Updated $file\n";
    }
}
echo "Backslash phase completed.\n";
