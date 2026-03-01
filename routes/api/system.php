<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\System\MediaController;
use App\Http\Controllers\Api\System\AuditLogController;
use App\Http\Controllers\Api\System\UserInvitationController;

// API Quản lý File chung
Route::post('media/upload', [MediaController::class, 'store']);

// User Invitations
Route::post('invitations', [UserInvitationController::class, 'store']);

// Audit Logs
Route::apiResource('audit-logs', AuditLogController::class)->only(['index', 'show']);
