<?php

use App\Http\Controllers\Api\Finance\VNPayController;
use App\Http\Controllers\Api\System\UserInvitationController;
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
Route::get('invitations/validate/{token}', [UserInvitationController::class, 'validateToken']);
Route::post('invitations/accept/{token}', [UserInvitationController::class, 'accept']);

// VNPay IPN Webhook (PUBLIC — không có auth, VNPay gọi server-to-server)
Route::post('finance/vnpay/ipn', [VNPayController::class, 'handleIpn'])->name('vnpay.ipn');


// --- Protected API Routes (Modularized Legacy) ---
Route::middleware('auth:sanctum')->group(function () {
    // Automatically load all .php files in the api/ directory
    $routeFiles = glob(__DIR__.'/api/*.php');

    foreach ($routeFiles as $file) {
        require $file;
    }
});

// --- Feature Module Routes (New Modular) ---
// Note: Each module's api.php handles its own middleware
$featureRouteFiles = glob(base_path('app/Features/*/Routes/api.php'));
foreach ($featureRouteFiles as $file) {
    require $file;
}
