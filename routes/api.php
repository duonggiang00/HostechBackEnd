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
Route::middleware(['auth:sanctum'])->post('/auth/logout', function (Illuminate\Http\Request $request) {
    // Revoke current Sanctum token
    $request->user()?->currentAccessToken()?->delete();

    return response()->json(['message' => 'Logged out successfully'], 200);
});

// Protected API Routes
Route::middleware('auth:sanctum')->prefix('v1')->group(function () {
    // Organizations
    Route::apiResource('orgs', OrgController::class);
    Route::post('orgs/{id}/restore', [OrgController::class, 'restore']);
    Route::delete('orgs/{id}/force', [OrgController::class, 'forceDelete']);

    // Users
    Route::apiResource('users', UserController::class);
    Route::post('users/{id}/restore', [UserController::class, 'restore']);
    Route::delete('users/{id}/force', [UserController::class, 'forceDelete']);

    // Properties
    Route::apiResource('properties', PropertyController::class);
    Route::post('properties/{id}/restore', [PropertyController::class, 'restore']);
    Route::delete('properties/{id}/force', [PropertyController::class, 'forceDelete']);

    // Floors
    Route::apiResource('floors', FloorController::class);
    Route::post('floors/{id}/restore', [FloorController::class, 'restore']);
    Route::delete('floors/{id}/force', [FloorController::class, 'forceDelete']);

    // Rooms
    Route::apiResource('rooms', RoomController::class);
    Route::post('rooms/{id}/restore', [RoomController::class, 'restore']);
    Route::delete('rooms/{id}/force', [RoomController::class, 'forceDelete']);
});
