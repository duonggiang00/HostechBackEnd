<?php

use App\Http\Controllers\Api\Service\RoomServiceController;
use App\Http\Controllers\Api\Service\ServiceController;
use Illuminate\Support\Facades\Route;

// Services
Route::get('services/trash', [ServiceController::class, 'trash']);
Route::apiResource('services', ServiceController::class);
Route::post('services/{id}/restore', [ServiceController::class, 'restore']);
Route::delete('services/{id}/force', [ServiceController::class, 'forceDelete']);

// Room Services
Route::apiResource('rooms.services', RoomServiceController::class);
