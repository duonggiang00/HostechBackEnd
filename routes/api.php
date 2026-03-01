<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\System\UserInvitationController;

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

// --- Protected API Routes (Modularized) ---
Route::middleware('auth:sanctum')->group(function () {
    // Automatically load all .php files in the api/ directory
    $routeFiles = glob(__DIR__ . '/api/*.php');
    
    foreach ($routeFiles as $file) {
        require $file;
    }
});
