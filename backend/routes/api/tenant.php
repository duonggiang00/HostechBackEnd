<?php

use App\Http\Controllers\Api\Meter\TenantMeterController;
use App\Http\Controllers\Api\Tenant\TenantBuildingOverviewController;
use App\Http\Controllers\Api\Tenant\TenantPaymentController;
use Illuminate\Support\Facades\Route;

/**
 * Tenant App Portal Routes
 *
 * Dedicated routes for residents in the App Portal scope.
 */
Route::prefix('app')->group(function () {
    // Sơ đồ tòa nhà
    Route::get('building-overview', [TenantBuildingOverviewController::class, 'index']);

    // Đồng hồ phòng (chỉ xem — chốt số do BQL thực hiện)
    Route::get('meters', [TenantMeterController::class, 'myMeters']);

    // Thanh toán thủ công (Tenant gửi bằng chứng → Manager duyệt)
    Route::prefix('payments')->group(function () {
        Route::get('/', [TenantPaymentController::class, 'index']);
        Route::post('submit-proof', [TenantPaymentController::class, 'submitProof'])
            ->middleware('throttle:payment-proof-submit');
    });
});
