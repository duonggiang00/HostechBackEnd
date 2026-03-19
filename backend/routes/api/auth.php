<?php

use App\Http\Controllers\Api\Auth\TwoFactorAuthenticationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth Routes (MFA, Profile, etc.)
|--------------------------------------------------------------------------
|
| Prefix via parent: /api/v1 (or as defined in RouteServiceProvider)
| Note: Fortify routes use /api/auth prefix directly from config/fortify.php
|
*/

Route::middleware(['auth:sanctum'])->prefix('user/mfa')->group(function () {
    Route::get('setup', [TwoFactorAuthenticationController::class, 'setup']);
    Route::post('enable', [TwoFactorAuthenticationController::class, 'enable']);
    Route::delete('disable', [TwoFactorAuthenticationController::class, 'disable']);
});
