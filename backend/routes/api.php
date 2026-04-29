<?php

use App\Http\Controllers\Api\Auth\TwoFactorChallengeController;
use App\Http\Controllers\Api\Finance\VNPayController;
use App\Http\Controllers\Api\System\UserInvitationController;
use App\Http\Middleware\EnrichApiLogContext;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Routes are now modularized. Public routes are defined directly here,
| while protected routes (auth:sanctum) are auto-loaded from the api/ directory.
|
*/

// --- Public API Routes ---
Route::prefix('system')->group(function () {
    Route::get('invitations/validate/{token}', [UserInvitationController::class, 'validateToken']);
    Route::post('invitations/accept/{token}', [UserInvitationController::class, 'accept']);
});

// 2FA Challenge (public — user is not yet authenticated, session-based)
Route::prefix('auth/two-factor-challenge')->group(function () {
    Route::post('/', [TwoFactorChallengeController::class, 'store']);
    Route::post('request-otp', [TwoFactorChallengeController::class, 'requestOtp']);
});

// VNPay IPN Webhook (PUBLIC — không có auth, VNPay gọi server-to-server)
Route::post('finance/vnpay/ipn', [VNPayController::class, 'handleIpn'])->name('vnpay.ipn');

// --- Protected API Routes (Modularized) ---
Route::middleware(['auth:sanctum', EnrichApiLogContext::class])->group(function () {
    // Broadcasting auth route for WebSocket private channels
    Broadcast::routes();

    // Automatically load all .php files in the api/ directory
    $routeFiles = glob(__DIR__.'/api/*.php');

    foreach ($routeFiles as $file) {
        require $file;
    }
});
