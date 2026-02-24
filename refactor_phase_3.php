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
    'App\Http\Controllers\Api\System\AuditLogController' => 'App\Http\Controllers\Api\System\AuditLogController', // catch if any

    // Services
    'App\Services\OrgService' => 'App\Services\Org\OrgService',
    'App\Services\UserService' => 'App\Services\Org\UserService',
    'App\Services\PropertyService' => 'App\Services\Property\PropertyService',
    'App\Services\FloorService' => 'App\Services\Property\FloorService',
    'App\Services\RoomService' => 'App\Services\Property\RoomService',
    'App\Services\ServiceService' => 'App\Services\Service\ServiceService',
    'App\Services\ContractService' => 'App\Services\Contract\ContractService',

    // Policies
    'App\Policies\OrgPolicy' => 'App\Policies\Org\OrgPolicy',
    'App\Policies\UserPolicy' => 'App\Policies\Org\UserPolicy',
    'App\Policies\PropertyPolicy' => 'App\Policies\Property\PropertyPolicy',
    'App\Policies\FloorPolicy' => 'App\Policies\Property\FloorPolicy',
    'App\Policies\RoomPolicy' => 'App\Policies\Property\RoomPolicy',
    'App\Policies\ServicePolicy' => 'App\Policies\Service\ServicePolicy',
    'App\Policies\ContractPolicy' => 'App\Policies\Contract\ContractPolicy',
    'App\Policies\AuditLogPolicy' => 'App\Policies\System\AuditLogPolicy',

    // Requests
    'App\Http\Requests\LoginRequest' => 'App\Http\Requests\Auth\LoginRequest',
    'App\Http\Requests\RegisterRequest' => 'App\Http\Requests\Auth\RegisterRequest',
    'App\Http\Requests\OrgIndexRequest' => 'App\Http\Requests\Org\OrgIndexRequest',
    'App\Http\Requests\OrgStoreRequest' => 'App\Http\Requests\Org\OrgStoreRequest',
    'App\Http\Requests\OrgUpdateRequest' => 'App\Http\Requests\Org\OrgUpdateRequest',
    'App\Http\Requests\UserIndexRequest' => 'App\Http\Requests\Org\UserIndexRequest',
    'App\Http\Requests\UserStoreRequest' => 'App\Http\Requests\Org\UserStoreRequest',
    'App\Http\Requests\UserUpdateRequest' => 'App\Http\Requests\Org\UserUpdateRequest',
    'App\Http\Requests\PropertyIndexRequest' => 'App\Http\Requests\Property\PropertyIndexRequest',
    'App\Http\Requests\PropertyStoreRequest' => 'App\Http\Requests\Property\PropertyStoreRequest',
    'App\Http\Requests\PropertyUpdateRequest' => 'App\Http\Requests\Property\PropertyUpdateRequest',
    'App\Http\Requests\FloorIndexRequest' => 'App\Http\Requests\Property\FloorIndexRequest',
    'App\Http\Requests\FloorStoreRequest' => 'App\Http\Requests\Property\FloorStoreRequest',
    'App\Http\Requests\FloorUpdateRequest' => 'App\Http\Requests\Property\FloorUpdateRequest',
    'App\Http\Requests\RoomIndexRequest' => 'App\Http\Requests\Property\RoomIndexRequest',
    'App\Http\Requests\RoomStoreRequest' => 'App\Http\Requests\Property\RoomStoreRequest',
    'App\Http\Requests\RoomUpdateRequest' => 'App\Http\Requests\Property\RoomUpdateRequest',
    'App\Http\Requests\ServiceIndexRequest' => 'App\Http\Requests\Service\ServiceIndexRequest',
    'App\Http\Requests\ServiceStoreRequest' => 'App\Http\Requests\Service\ServiceStoreRequest',
    'App\Http\Requests\ServiceUpdateRequest' => 'App\Http\Requests\Service\ServiceUpdateRequest',
    'App\Http\Requests\ContractIndexRequest' => 'App\Http\Requests\Contract\ContractIndexRequest',
    'App\Http\Requests\ContractStoreRequest' => 'App\Http\Requests\Contract\ContractStoreRequest',
    'App\Http\Requests\ContractUpdateRequest' => 'App\Http\Requests\Contract\ContractUpdateRequest',

    // Resources
    'App\Http\Resources\OrgResource' => 'App\Http\Resources\Org\OrgResource',
    'App\Http\Resources\UserResource' => 'App\Http\Resources\Org\UserResource',
    'App\Http\Resources\PropertyResource' => 'App\Http\Resources\Property\PropertyResource',
    'App\Http\Resources\FloorResource' => 'App\Http\Resources\Property\FloorResource',
    'App\Http\Resources\RoomResource' => 'App\Http\Resources\Property\RoomResource',
    'App\Http\Resources\ServiceResource' => 'App\Http\Resources\Service\ServiceResource',
    'App\Http\Resources\ServiceRateResource' => 'App\Http\Resources\Service\ServiceRateResource',
    'App\Http\Resources\ContractResource' => 'App\Http\Resources\Contract\ContractResource',
    'App\Http\Resources\ContractMemberResource' => 'App\Http\Resources\Contract\ContractMemberResource',

    // Responses
    'App\Http\Responses\LoginResponse' => 'App\Http\Responses\Auth\LoginResponse',
    'App\Http\Responses\LogoutResponse' => 'App\Http\Responses\Auth\LogoutResponse',
    'App\Http\Responses\RegisterResponse' => 'App\Http\Responses\Auth\RegisterResponse',
];

uksort($replacements, function($a, $b) {
    return strlen($b) - strlen($a);
});

$directories = ['app', 'routes', 'database', 'tests', 'bootstrap'];

function scanAllDir($dir) {
    if (!is_dir($dir)) return [];
    $result = [];
    foreach(scandir($dir) as $filename) {
        if ($filename[0] === '.') continue;
        $filePath = $dir . '/' . $filename;
        if (is_dir($filePath)) {
            foreach (scanAllDir($filePath) as $childFilename) {
                $result[] = $childFilename;
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
        $escapedOld = preg_quote($old, '/');
        // Match old class name exact bounds to prevent recursive replacement (e.g., replacing App\Models\Org inside App\Models\Org\Org)
        $pattern = '/(?<![a-zA-Z0-9_\\\\])' . $escapedOld . '(?![a-zA-Z0-9_\\\\])/';
        
        $content = preg_replace_callback($pattern, function($matches) use (&$changed, $new) {
            $changed = true;
            return $new;
        }, $content);
    }
    if ($changed) {
        file_put_contents($file, $content);
        echo "Updated $file\n";
    }
}
echo "Phase 3 completed.\n";
