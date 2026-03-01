<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Org\OrgController;
use App\Http\Controllers\Api\Org\UserController;
use App\Http\Controllers\Api\Org\ProfileController;

// Profile — Hồ sơ cá nhân
Route::get('profile', [ProfileController::class, 'show']);
Route::put('profile', [ProfileController::class, 'update']);
Route::post('profile/change-password', [ProfileController::class, 'changePassword']);
Route::post('profile/avatar', [ProfileController::class, 'uploadAvatar']);
Route::get('profile/mfa-status', [ProfileController::class, 'mfaStatus']);

// Organizations
Route::get('orgs/trash', [OrgController::class, 'trash']);
Route::apiResource('orgs', OrgController::class);
Route::post('orgs/{id}/restore', [OrgController::class, 'restore']);
Route::delete('orgs/{id}/force', [OrgController::class, 'forceDelete']);
Route::get('orgs/{id}/properties', [OrgController::class, 'properties']);
Route::get('orgs/{id}/users', [OrgController::class, 'users']);
Route::get('orgs/{id}/services', [OrgController::class, 'services']);

// Users
Route::get('users/trash', [UserController::class, 'trash']);
Route::apiResource('users', UserController::class);
Route::post('users/{id}/restore', [UserController::class, 'restore']);
Route::delete('users/{id}/force', [UserController::class, 'forceDelete']);
