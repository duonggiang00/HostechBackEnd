<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Meter\MeterController;
use App\Http\Controllers\Api\Meter\MeterReadingController;
use App\Http\Controllers\Api\Meter\AdjustmentNoteController;

// Meters
Route::get('properties/{property_id}/meters', [MeterController::class, 'indexByProperty']);
Route::get('properties/{property_id}/floors/{floor_id}/meters', [MeterController::class, 'indexByFloor']);
Route::apiResource('meters', MeterController::class);

// Meter Readings
Route::apiResource('meters.readings', MeterReadingController::class)->scoped();

// Meter Reading Adjustments
Route::post('meter-readings/{reading}/adjustments', [AdjustmentNoteController::class, 'store']);
Route::get('meter-readings/{reading}/adjustments', [AdjustmentNoteController::class, 'index']);
Route::put('meter-readings/{reading}/adjustments/{adjustment}/approve', [AdjustmentNoteController::class, 'approve']);
Route::put('meter-readings/{reading}/adjustments/{adjustment}/reject', [AdjustmentNoteController::class, 'reject']);
