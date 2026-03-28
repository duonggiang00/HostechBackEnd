<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Notification\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected NotificationService $notificationService,
    ) {}

    /**
     * GET /api/notifications
     * Danh sách thông báo (paginated).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);
        $notifications = $this->notificationService->getUserNotifications($request->user(), $perPage);

        return response()->json([
            'success' => true,
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    /**
     * GET /api/notifications/unread-count
     * Số thông báo chưa đọc.
     */
    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount($request->user());

        return response()->json([
            'success' => true,
            'data' => ['unread_count' => $count],
        ]);
    }

    /**
     * PATCH /api/notifications/{id}/read
     * Đánh dấu đã đọc 1 thông báo.
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $result = $this->notificationService->markAsRead($id, $request->user());

        if (!$result) {
            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy thông báo.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Đã đánh dấu đã đọc.',
        ]);
    }

    /**
     * POST /api/notifications/mark-all-read
     * Đánh dấu tất cả đã đọc.
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user());

        return response()->json([
            'success' => true,
            'message' => "Đã đánh dấu {$count} thông báo đã đọc.",
            'data' => ['marked_count' => $count],
        ]);
    }
}
