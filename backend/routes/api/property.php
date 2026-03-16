<?php

use App\Http\Controllers\Api\Property\FloorController;
use App\Http\Controllers\Api\Property\PropertyController;
use App\Http\Controllers\Api\Property\RoomAssetController;
use App\Http\Controllers\Api\Property\RoomController;
use Illuminate\Support\Facades\Route;

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
Route::post('floors/{id}/sync-floor-plan', [FloorController::class, 'syncFloorPlan']);
Route::post('floors/{id}/upload-floor-plan', [FloorController::class, 'uploadImage']);

// Rooms
Route::get('rooms/trash', [RoomController::class, 'trash']);
Route::post('rooms/quick', [RoomController::class, 'quickCreate']);    // Tạo nhanh draft
Route::get('rooms/drafts', [RoomController::class, 'drafts']);          // Danh sách draft
Route::post('rooms/{id}/publish', [RoomController::class, 'publish']); // Publish draft
Route::put('rooms/{id}/floor-plan', [RoomController::class, 'setFloorPlan']);       // Gán floor plan
Route::delete('rooms/{id}/floor-plan', [RoomController::class, 'removeFloorPlan']); // Xóa floor plan
Route::apiResource('rooms', RoomController::class);
Route::post('rooms/{id}/restore', [RoomController::class, 'restore']);
Route::delete('rooms/{id}/force', [RoomController::class, 'forceDelete']);

// Nested Floors API
Route::apiResource('properties.floors', FloorController::class)->shallow();

// Nested Rooms API
Route::apiResource('properties.rooms', RoomController::class)->shallow();

// Nested Room Assets API (under Room)
Route::apiResource('properties.rooms.assets', RoomAssetController::class)
    ->parameters([
        'assets' => 'asset',
    ]);
