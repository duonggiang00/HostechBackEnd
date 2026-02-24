<?php

use App\Http\Controllers\Api\Property\FloorController;
use App\Http\Controllers\Api\Org\OrgController;
use App\Http\Controllers\Api\Property\PropertyController;
use App\Http\Controllers\Api\Property\RoomController;
use App\Http\Controllers\Api\Org\UserController;
use Illuminate\Support\Facades\Route;

// Fortify automatically registers these routes:
// - POST /api/auth/register
// - POST /api/auth/login
// - POST /api/auth/logout (uses auth:web for sessions)

// For API clients using Sanctum tokens, provide a logout endpoint
/**
 * Đăng xuất
 *
 * Hủy bỏ token hiện tại, đăng xuất khỏi hệ thống.
 * 
 * @tags Xác thực (Auth)
 */
Route::middleware(['auth:sanctum'])->post('/auth/logout', function (Illuminate\Http\Request $request) {
    // Revoke current Sanctum token
    $request->user()?->currentAccessToken()?->delete();

    return response()->json(['message' => 'Logged out successfully'], 200);
});

Route::middleware(['auth:sanctum'])->get('/auth/me', function (Illuminate\Http\Request $request) {
    return $request->user();
});

// Protected API Routes
Route::middleware('auth:sanctum')->group(function () {
    // Organizations
    Route::get('orgs/trash', [OrgController::class, 'trash']);
    Route::apiResource('orgs', OrgController::class);
    Route::post('orgs/{id}/restore', [OrgController::class, 'restore']);
    Route::delete('orgs/{id}/force', [OrgController::class, 'forceDelete']);
    Route::get('orgs/{id}/properties', [OrgController::class, 'properties']);
    Route::get('orgs/{id}/users', [OrgController::class, 'users']);
    Route::get('orgs/{id}/services', [OrgController::class, 'services']);

    // Users
    Route::get('users/trash', [UserController::class, 'trash']);
    Route::apiResource('users', UserController::class);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);
    Route::delete('users/{id}/force', [UserController::class, 'forceDelete']);

    // Properties
    Route::get('properties/trash', [PropertyController::class, 'trash']);
    Route::apiResource('properties', PropertyController::class);
    Route::post('properties/{id}/restore', [PropertyController::class, 'restore']);
    Route::delete('properties/{id}/force', [PropertyController::class, 'forceDelete']);

    // Floors
    Route::get('floors/trash', [FloorController::class, 'trash']);
    Route::apiResource('floors', FloorController::class);
    Route::post('floors/{id}/restore', [FloorController::class, 'restore']);
    Route::delete('floors/{id}/force', [FloorController::class, 'forceDelete']);

    // Rooms
    Route::get('rooms/trash', [RoomController::class, 'trash']);
    Route::apiResource('rooms', RoomController::class);
    Route::post('rooms/{id}/restore', [RoomController::class, 'restore']);
    Route::delete('rooms/{id}/force', [RoomController::class, 'forceDelete']);

    // Services
    Route::get('services/trash', [\App\Http\Controllers\Api\Service\ServiceController::class, 'trash']);
    Route::apiResource('services', \App\Http\Controllers\Api\Service\ServiceController::class);
    Route::post('services/{id}/restore', [\App\Http\Controllers\Api\Service\ServiceController::class, 'restore']);
    Route::delete('services/{id}/force', [\App\Http\Controllers\Api\Service\ServiceController::class, 'forceDelete']);

    // Audit Logs
    Route::apiResource('audit-logs', \App\Http\Controllers\Api\System\AuditLogController::class)->only(['index', 'show']);

    // Contracts
    Route::get('contracts/trash', [\App\Http\Controllers\Api\Contract\ContractController::class, 'trash']);
    Route::apiResource('contracts', \App\Http\Controllers\Api\Contract\ContractController::class);
    Route::post('contracts/{id}/restore', [\App\Http\Controllers\Api\Contract\ContractController::class, 'restore']);
    Route::delete('contracts/{id}/force', [\App\Http\Controllers\Api\Contract\ContractController::class, 'forceDelete']);
});
