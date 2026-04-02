<?php

namespace App\Features\Notification\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Notification\Models\NotificationTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationTemplateController extends Controller
{
    /**
     * GET /api/notification-templates
     * Danh sách templates (filtered by org, property, channel).
     */
    public function index(Request $request): JsonResponse
    {
        $query = NotificationTemplate::query();

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('channel')) {
            $query->byChannel($request->channel);
        }

        if ($request->filled('code')) {
            $query->byCode($request->code);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $templates = $query->orderBy('code')->orderBy('channel')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'last_page' => $templates->lastPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
            ],
        ]);
    }

    /**
     * POST /api/notification-templates
     * Tạo template mới.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id' => 'nullable|uuid|exists:properties,id',
            'code' => 'required|string|max:100',
            'channel' => 'required|string|in:IN_APP,EMAIL,SMS,ZALO,PUSH',
            'title' => 'nullable|string|max:255',
            'body' => 'required|string',
            'variables' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $validated['org_id'] = auth()->user()->org_id;

        $template = NotificationTemplate::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Template đã được tạo.',
            'data' => $template,
        ], 201);
    }

    /**
     * GET /api/notification-templates/{id}
     * Chi tiết template.
     */
    public function show(string $id): JsonResponse
    {
        $template = NotificationTemplate::with('rules')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $template,
        ]);
    }

    /**
     * PUT /api/notification-templates/{id}
     * Cập nhật template.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $template = NotificationTemplate::findOrFail($id);

        $validated = $request->validate([
            'property_id' => 'nullable|uuid|exists:properties,id',
            'code' => 'sometimes|string|max:100',
            'channel' => 'sometimes|string|in:IN_APP,EMAIL,SMS,ZALO,PUSH',
            'title' => 'nullable|string|max:255',
            'body' => 'sometimes|string',
            'variables' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        // Auto-increment version when body or title changes
        if (isset($validated['body']) || isset($validated['title'])) {
            $validated['version'] = $template->version + 1;
        }

        $template->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Template đã được cập nhật.',
            'data' => $template->fresh(),
        ]);
    }

    /**
     * DELETE /api/notification-templates/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $template = NotificationTemplate::findOrFail($id);

        // Prevent deleting templates with active rules
        if ($template->rules()->where('is_active', true)->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Không thể xóa template đang được sử dụng bởi rule hoạt động.',
            ], 422);
        }

        $template->delete();

        return response()->json([
            'success' => true,
            'message' => 'Template đã được xóa.',
        ]);
    }

    /**
     * POST /api/notification-templates/{id}/preview
     * Preview template rendering with sample data.
     */
    public function preview(Request $request, string $id): JsonResponse
    {
        $template = NotificationTemplate::findOrFail($id);

        $sampleData = $request->input('data', []);
        $rendered = $template->render($sampleData);

        return response()->json([
            'success' => true,
            'data' => [
                'template' => $template,
                'rendered' => $rendered,
            ],
        ]);
    }
}
