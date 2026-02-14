<?php

use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\OrgController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\UserController;
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

    // Audit Logs
    Route::apiResource('audit-logs', \App\Http\Controllers\Api\V1\AuditLogController::class)->only(['index', 'show']);
});
