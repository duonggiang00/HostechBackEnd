<?php

use App\Http\Controllers\Api\Handover\HandoverController;
use Illuminate\Support\Facades\Route;

// Handovers
Route::apiResource('handovers', HandoverController::class);
Route::post('handovers/{handover}/document-scans', [HandoverController::class, 'documentScanStore']);

// Handover Items
Route::get('handovers/{handover}/items', [HandoverController::class, 'itemsIndex']);
Route::post('handovers/{handover}/items', [HandoverController::class, 'itemsStore']);
Route::put('handovers/{handover}/items/{handoverItem}', [HandoverController::class, 'itemsUpdate']);
Route::post('handovers/{handover}/items/{handoverItem}/photos', [HandoverController::class, 'itemPhotoStore']);
Route::delete('handovers/{handover}/items/{handoverItem}', [HandoverController::class, 'itemsDestroy']);

// Handover Meter Snapshots
Route::get('handovers/{handover}/snapshots', [HandoverController::class, 'snapshotsIndex']);
Route::post('handovers/{handover}/snapshots', [HandoverController::class, 'snapshotsStore']);
Route::delete('handovers/{handover}/snapshots/{handoverMeterSnapshot}', [HandoverController::class, 'snapshotsDestroy']);
