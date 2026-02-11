<?php

use App\Http\Controllers\Api\OrgController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\RoomController;
use App\Http\Controllers\Api\FloorController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Organizations
    Route::apiResource('orgs', OrgController::class);

    // Users
    Route::apiResource('users', UserController::class);

    // Properties
    Route::apiResource('properties', PropertyController::class);

    // Floors
    Route::apiResource('floors', FloorController::class);

    // Rooms
    Route::apiResource('rooms', RoomController::class);
});

