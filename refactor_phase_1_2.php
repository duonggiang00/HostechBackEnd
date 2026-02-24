<?php

$basePath = __DIR__;

$moves = [
    // Models - Org
    'app/Models/Org.php' => 'app/Models/Org/Org.php',
    'app/Models/User.php' => 'app/Models/Org/User.php',
    // Models - Property
    'app/Models/Property.php' => 'app/Models/Property/Property.php',
    'app/Models/Floor.php' => 'app/Models/Property/Floor.php',
    'app/Models/Room.php' => 'app/Models/Property/Room.php',
    'app/Models/RoomAsset.php' => 'app/Models/Property/RoomAsset.php',
    'app/Models/RoomPhoto.php' => 'app/Models/Property/RoomPhoto.php',
    'app/Models/RoomPrice.php' => 'app/Models/Property/RoomPrice.php',
    // Models - Service
    'app/Models/Service.php' => 'app/Models/Service/Service.php',
    'app/Models/ServiceRate.php' => 'app/Models/Service/ServiceRate.php',
    'app/Models/TieredRate.php' => 'app/Models/Service/TieredRate.php',
    'app/Models/RoomService.php' => 'app/Models/Service/RoomService.php',
    // Models - Contract
    'app/Models/Contract.php' => 'app/Models/Contract/Contract.php',
    'app/Models/ContractMember.php' => 'app/Models/Contract/ContractMember.php',
    // Models - System
    'app/Models/AuditLog.php' => 'app/Models/System/AuditLog.php',

    // Controllers - Org
    'app/Http/Controllers/Api/OrgController.php' => 'app/Http/Controllers/Api/Org/OrgController.php',
    'app/Http/Controllers/Api/UserController.php' => 'app/Http/Controllers/Api/Org/UserController.php',
    // Controllers - Property
    'app/Http/Controllers/Api/PropertyController.php' => 'app/Http/Controllers/Api/Property/PropertyController.php',
    'app/Http/Controllers/Api/FloorController.php' => 'app/Http/Controllers/Api/Property/FloorController.php',
    'app/Http/Controllers/Api/RoomController.php' => 'app/Http/Controllers/Api/Property/RoomController.php',
    // Controllers - Service
    'app/Http/Controllers/Api/ServiceController.php' => 'app/Http/Controllers/Api/Service/ServiceController.php',
    // Controllers - Contract
    'app/Http/Controllers/Api/ContractController.php' => 'app/Http/Controllers/Api/Contract/ContractController.php',
    // Controllers - System
    'app/Http/Controllers/Api/V1/AuditLogController.php' => 'app/Http/Controllers/Api/System/AuditLogController.php',

    // Services - Org
    'app/Services/OrgService.php' => 'app/Services/Org/OrgService.php',
    'app/Services/UserService.php' => 'app/Services/Org/UserService.php',
    // Services - Property
    'app/Services/PropertyService.php' => 'app/Services/Property/PropertyService.php',
    'app/Services/FloorService.php' => 'app/Services/Property/FloorService.php',
    'app/Services/RoomService.php' => 'app/Services/Property/RoomService.php',
    // Services - Service
    'app/Services/ServiceService.php' => 'app/Services/Service/ServiceService.php',
    // Services - Contract
    'app/Services/ContractService.php' => 'app/Services/Contract/ContractService.php',

    // Policies - Org
    'app/Policies/OrgPolicy.php' => 'app/Policies/Org/OrgPolicy.php',
    'app/Policies/UserPolicy.php' => 'app/Policies/Org/UserPolicy.php',
    // Policies - Property
    'app/Policies/PropertyPolicy.php' => 'app/Policies/Property/PropertyPolicy.php',
    'app/Policies/FloorPolicy.php' => 'app/Policies/Property/FloorPolicy.php',
    'app/Policies/RoomPolicy.php' => 'app/Policies/Property/RoomPolicy.php',
    // Policies - Service
    'app/Policies/ServicePolicy.php' => 'app/Policies/Service/ServicePolicy.php',
    // Policies - Contract
    'app/Policies/ContractPolicy.php' => 'app/Policies/Contract/ContractPolicy.php',
    // Policies - System
    'app/Policies/AuditLogPolicy.php' => 'app/Policies/System/AuditLogPolicy.php',

    // Requests - Auth
    'app/Http/Requests/LoginRequest.php' => 'app/Http/Requests/Auth/LoginRequest.php',
    'app/Http/Requests/RegisterRequest.php' => 'app/Http/Requests/Auth/RegisterRequest.php',
    // Requests - Org
    'app/Http/Requests/OrgIndexRequest.php' => 'app/Http/Requests/Org/OrgIndexRequest.php',
    'app/Http/Requests/OrgStoreRequest.php' => 'app/Http/Requests/Org/OrgStoreRequest.php',
    'app/Http/Requests/OrgUpdateRequest.php' => 'app/Http/Requests/Org/OrgUpdateRequest.php',
    'app/Http/Requests/UserIndexRequest.php' => 'app/Http/Requests/Org/UserIndexRequest.php',
    'app/Http/Requests/UserStoreRequest.php' => 'app/Http/Requests/Org/UserStoreRequest.php',
    'app/Http/Requests/UserUpdateRequest.php' => 'app/Http/Requests/Org/UserUpdateRequest.php',
    // Requests - Property
    'app/Http/Requests/PropertyIndexRequest.php' => 'app/Http/Requests/Property/PropertyIndexRequest.php',
    'app/Http/Requests/PropertyStoreRequest.php' => 'app/Http/Requests/Property/PropertyStoreRequest.php',
    'app/Http/Requests/PropertyUpdateRequest.php' => 'app/Http/Requests/Property/PropertyUpdateRequest.php',
    'app/Http/Requests/FloorIndexRequest.php' => 'app/Http/Requests/Property/FloorIndexRequest.php',
    'app/Http/Requests/FloorStoreRequest.php' => 'app/Http/Requests/Property/FloorStoreRequest.php',
    'app/Http/Requests/FloorUpdateRequest.php' => 'app/Http/Requests/Property/FloorUpdateRequest.php',
    'app/Http/Requests/RoomIndexRequest.php' => 'app/Http/Requests/Property/RoomIndexRequest.php',
    'app/Http/Requests/RoomStoreRequest.php' => 'app/Http/Requests/Property/RoomStoreRequest.php',
    'app/Http/Requests/RoomUpdateRequest.php' => 'app/Http/Requests/Property/RoomUpdateRequest.php',
    // Requests - Service
    'app/Http/Requests/ServiceIndexRequest.php' => 'app/Http/Requests/Service/ServiceIndexRequest.php',
    'app/Http/Requests/ServiceStoreRequest.php' => 'app/Http/Requests/Service/ServiceStoreRequest.php',
    'app/Http/Requests/ServiceUpdateRequest.php' => 'app/Http/Requests/Service/ServiceUpdateRequest.php',
    // Requests - Contract
    'app/Http/Requests/ContractIndexRequest.php' => 'app/Http/Requests/Contract/ContractIndexRequest.php',
    'app/Http/Requests/ContractStoreRequest.php' => 'app/Http/Requests/Contract/ContractStoreRequest.php',
    'app/Http/Requests/ContractUpdateRequest.php' => 'app/Http/Requests/Contract/ContractUpdateRequest.php',

    // Resources - Org
    'app/Http/Resources/OrgResource.php' => 'app/Http/Resources/Org/OrgResource.php',
    'app/Http/Resources/UserResource.php' => 'app/Http/Resources/Org/UserResource.php',
    // Resources - Property
    'app/Http/Resources/PropertyResource.php' => 'app/Http/Resources/Property/PropertyResource.php',
    'app/Http/Resources/FloorResource.php' => 'app/Http/Resources/Property/FloorResource.php',
    'app/Http/Resources/RoomResource.php' => 'app/Http/Resources/Property/RoomResource.php',
    // Resources - Service
    'app/Http/Resources/ServiceResource.php' => 'app/Http/Resources/Service/ServiceResource.php',
    'app/Http/Resources/ServiceRateResource.php' => 'app/Http/Resources/Service/ServiceRateResource.php',
    // Resources - Contract
    'app/Http/Resources/ContractResource.php' => 'app/Http/Resources/Contract/ContractResource.php',
    'app/Http/Resources/ContractMemberResource.php' => 'app/Http/Resources/Contract/ContractMemberResource.php',
    
    // Auth Responses
    'app/Http/Responses/LoginResponse.php' => 'app/Http/Responses/Auth/LoginResponse.php',
    'app/Http/Responses/LogoutResponse.php' => 'app/Http/Responses/Auth/LogoutResponse.php',
    'app/Http/Responses/RegisterResponse.php' => 'app/Http/Responses/Auth/RegisterResponse.php',
];

$namespaceReplacements = [
    // Models
    'namespace App\Models;' => function($file) {
        if (strpos($file, 'Org/') !== false) return 'namespace App\Models\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace App\Models\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace App\Models\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace App\Models\Contract;';
        if (strpos($file, 'System/') !== false) return 'namespace App\Models\System;';
        return 'namespace App\Models;';
    },
    // Controllers
    'namespace App\Http\Controllers\Api;' => function($file) {
        if (strpos($file, 'Org/') !== false) return 'namespace App\Http\Controllers\Api\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace App\Http\Controllers\Api\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace App\Http\Controllers\Api\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace App\Http\Controllers\Api\Contract;';
        if (strpos($file, 'System/') !== false) return 'namespace App\Http\Controllers\Api\System;';
        return 'namespace App\Http\Controllers\Api;';
    },
    'namespace App\Http\Controllers\Api\V1;' => 'namespace App\Http\Controllers\Api\System;',
    
    // Services
    'namespace App\Services;' => function($file) {
        if (strpos($file, 'Org/') !== false) return 'namespace App\Services\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace App\Services\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace App\Services\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace App\Services\Contract;';
        return 'namespace App\Services;';
    },

    // Policies
    'namespace App\Policies;' => function($file) {
        if (strpos($file, 'Org/') !== false) return 'namespace App\Policies\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace App\Policies\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace App\Policies\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace App\Policies\Contract;';
        if (strpos($file, 'System/') !== false) return 'namespace App\Policies\System;';
        return 'namespace App\Policies;';
    },

    // Requests
    'namespace App\Http\Requests;' => function($file) {
        if (strpos($file, 'Auth/') !== false) return 'namespace App\Http\Requests\Auth;';
        if (strpos($file, 'Org/') !== false) return 'namespace App\Http\Requests\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace App\Http\Requests\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace App\Http\Requests\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace App\Http\Requests\Contract;';
        return 'namespace App\Http\Requests;';
    },

    // Resources
    'namespace App\Http\Resources;' => function($file) {
        if (strpos($file, 'Org/') !== false) return 'namespace App\Http\Resources\Org;';
        if (strpos($file, 'Property/') !== false) return 'namespace App\Http\Resources\Property;';
        if (strpos($file, 'Service/') !== false) return 'namespace App\Http\Resources\Service;';
        if (strpos($file, 'Contract/') !== false) return 'namespace App\Http\Resources\Contract;';
        return 'namespace App\Http\Resources;';
    },

    // Responses
    'namespace App\Http\Responses;' => function($file) {
        if (strpos($file, 'Auth/') !== false) return 'namespace App\Http\Responses\Auth;';
        return 'namespace App\Http\Responses;';
    },
];

foreach ($moves as $old => $new) {
    $fullOld = $basePath . '/' . $old;
    $fullNew = $basePath . '/' . $new;

    if (file_exists($fullOld)) {
        // Create dir if not exists
        $dir = dirname($fullNew);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        // Move file
        rename($fullOld, $fullNew);
        echo "Moved $old to $new\n";

        // Update namespace
        $content = file_get_contents($fullNew);
        
        foreach ($namespaceReplacements as $search => $replace) {
            if (is_callable($replace)) {
                $content = str_replace($search, $replace($new), $content);
            } else {
                $content = str_replace($search, $replace, $content);
            }
        }
        
        file_put_contents($fullNew, $content);
    } else {
        echo "File $old not found\n";
    }
}
echo "Phase 1 & 2 completed.\n";
