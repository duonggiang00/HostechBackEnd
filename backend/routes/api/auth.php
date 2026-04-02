<?php

use App\Features\Org\Controllers\ProfileController;
use App\Features\Org\Controllers\Auth\TwoFactorAuthenticationController;

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth Routes (MFA, Profile, etc.)
|--------------------------------------------------------------------------
|
| Prefix via parent: 
| Note: Fortify routes use /api/auth prefix directly from config/fortify.php
|
*/

// Current User Profile
Route::get('auth/me', [ProfileController::class, 'show']);

// MFA Management
Route::prefix('user/mfa')->group(function () {
    Route::get('setup', [TwoFactorAuthenticationController::class, 'setup']);
    Route::post('initialize', [TwoFactorAuthenticationController::class, 'initialize']);
    Route::post('enable', [TwoFactorAuthenticationController::class, 'enable']);
    Route::delete('disable', [TwoFactorAuthenticationController::class, 'disable']);
});

// Logout (Overriding Fortify to support Sanctum tokens)
Route::post('auth/logout', function (\Illuminate\Http\Request $request) {
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out successfully'], 200);
});
