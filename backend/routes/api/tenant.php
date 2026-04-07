<?php

use App\Http\Controllers\Api\Tenant\TenantBuildingOverviewController;
use Illuminate\Support\Facades\Route;

/**
 * Tenant App Portal Routes
 *
 * Dedicated routes for residents in the App Portal scope.
 */
Route::prefix('app')->group(function () {
    // Sơ đồ tòa nhà
    Route::get('building-overview', [TenantBuildingOverviewController::class, 'index']);
});
