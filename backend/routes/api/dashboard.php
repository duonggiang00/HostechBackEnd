<?php

use App\Http\Controllers\Api\Dashboard\DashboardController;
use Illuminate\Support\Facades\Route;

// Dashboard — auto-detect role
Route::get('dashboard', [DashboardController::class, 'index']);

// Dashboard — role-specific endpoints
Route::get('dashboard/admin', [DashboardController::class, 'admin']);
Route::get('dashboard/owner', [DashboardController::class, 'owner']);
Route::get('dashboard/manager', [DashboardController::class, 'manager']);
