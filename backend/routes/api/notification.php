<?php

use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationRuleController;
use App\Http\Controllers\Api\NotificationTemplateController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notification API Routes
|--------------------------------------------------------------------------
| Inbox (Phase 1):
|   GET    /api/notifications               → Danh sách thông báo (paginated)
|   GET    /api/notifications/unread-count  → Số thông báo chưa đọc
|   PATCH  /api/notifications/{id}/read     → Đánh dấu đã đọc
|   POST   /api/notifications/mark-all-read → Đánh dấu tất cả đã đọc
|
| Templates (Phase 2):
|   CRUD   /api/notification-templates
|   POST   /api/notification-templates/{id}/preview → Preview rendering
|
| Rules (Phase 2):
|   CRUD   /api/notification-rules
|   PATCH  /api/notification-rules/{id}/toggle → Bật/tắt rule
*/

// ─── Inbox (Phase 1) ────────────────────────────────
Route::prefix('notifications')->group(function () {
    Route::get('/', [NotificationController::class, 'index']);
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
});

// ─── Templates (Phase 2) ────────────────────────────
Route::prefix('notification-templates')->group(function () {
    Route::get('/', [NotificationTemplateController::class, 'index']);
    Route::post('/', [NotificationTemplateController::class, 'store']);
    Route::get('/{id}', [NotificationTemplateController::class, 'show']);
    Route::put('/{id}', [NotificationTemplateController::class, 'update']);
    Route::delete('/{id}', [NotificationTemplateController::class, 'destroy']);
    Route::post('/{id}/preview', [NotificationTemplateController::class, 'preview']);
});

// ─── Rules (Phase 2) ────────────────────────────────
Route::prefix('notification-rules')->group(function () {
    Route::get('/', [NotificationRuleController::class, 'index']);
    Route::post('/', [NotificationRuleController::class, 'store']);
    Route::put('/{id}', [NotificationRuleController::class, 'update']);
    Route::patch('/{id}/toggle', [NotificationRuleController::class, 'toggle']);
    Route::delete('/{id}', [NotificationRuleController::class, 'destroy']);
});
