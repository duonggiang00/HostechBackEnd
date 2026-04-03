<?php

use App\Http\Controllers\Api\System\AuditLogController;
use App\Http\Controllers\Api\System\MediaController;
use App\Http\Controllers\Api\System\SessionController;
use App\Http\Controllers\Api\System\UserInvitationController;
use Illuminate\Support\Facades\Route;

// API Quản lý File chung
Route::post('media/upload', [MediaController::class, 'store']);

// User Invitations
Route::get('invitations', [UserInvitationController::class, 'index']);
Route::post('invitations', [UserInvitationController::class, 'store']);
Route::delete('invitations/{id}', [UserInvitationController::class, 'destroy']);

// Audit Logs
Route::apiResource('audit-logs', AuditLogController::class)->only(['index', 'show']);

// Session Management
Route::get('sessions', [SessionController::class, 'index']);
Route::delete('sessions/{id}', [SessionController::class, 'destroy']);
Route::post('sessions/revoke-others', [SessionController::class, 'revokeOthers']);
