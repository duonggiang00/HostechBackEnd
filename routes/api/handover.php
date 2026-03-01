<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Handover\HandoverController;

// Handovers
Route::apiResource('handovers', HandoverController::class);
Route::post('handovers/{handover}/confirm', [HandoverController::class, 'confirm']);

// Handover Items
Route::get('handovers/{handover}/items', [HandoverController::class, 'itemsIndex']);
Route::post('handovers/{handover}/items', [HandoverController::class, 'itemsStore']);
Route::put('handovers/{handover}/items/{handoverItem}', [HandoverController::class, 'itemsUpdate']);
Route::delete('handovers/{handover}/items/{handoverItem}', [HandoverController::class, 'itemsDestroy']);

// Handover Meter Snapshots
Route::get('handovers/{handover}/snapshots', [HandoverController::class, 'snapshotsIndex']);
Route::post('handovers/{handover}/snapshots', [HandoverController::class, 'snapshotsStore']);
Route::delete('handovers/{handover}/snapshots/{handoverMeterSnapshot}', [HandoverController::class, 'snapshotsDestroy']);
