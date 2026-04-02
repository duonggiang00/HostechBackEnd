<?php

use App\Features\Service\Controllers\RoomServiceController;
use App\Features\Service\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

// This file is auto-loaded by App\Providers\FeatureServiceProvider

Route::middleware('auth:sanctum')->group(function () {
    // Services
    Route::get('services/trash', [ServiceController::class, 'trash']);
    Route::apiResource('services', ServiceController::class);
    Route::post('services/{id}/restore', [ServiceController::class, 'restore']);
    Route::delete('services/{id}/force', [ServiceController::class, 'forceDelete']);

    // Room Services
    Route::apiResource('rooms.services', RoomServiceController::class);
});
