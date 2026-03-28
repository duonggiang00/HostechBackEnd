<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification\NotificationRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationRuleController extends Controller
{
    /**
     * GET /api/notification-rules
     * Danh sách rules (filtered by trigger, property, status).
     */
    public function index(Request $request): JsonResponse
    {
        $query = NotificationRule::with('template:id,code,channel,title');

        if ($request->filled('property_id')) {
            $query->where('property_id', $request->property_id);
        }

        if ($request->filled('trigger')) {
            $query->byTrigger($request->trigger);
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        $rules = $query->orderBy('trigger')->paginate($request->input('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $rules->items(),
            'meta' => [
                'current_page' => $rules->currentPage(),
                'last_page' => $rules->lastPage(),
                'per_page' => $rules->perPage(),
                'total' => $rules->total(),
            ],
        ]);
    }

    /**
     * POST /api/notification-rules
     * Tạo rule mới.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'property_id' => 'nullable|uuid|exists:properties,id',
            'trigger' => 'required|string|max:100',
            'schedule' => 'nullable|array',
            'template_id' => 'required|uuid|exists:notification_templates,id',
            'is_active' => 'boolean',
        ]);

        $validated['org_id'] = auth()->user()->org_id;

        $rule = NotificationRule::create($validated);
        $rule->load('template:id,code,channel,title');

        return response()->json([
            'success' => true,
            'message' => 'Rule đã được tạo.',
            'data' => $rule,
        ], 201);
    }

    /**
     * PUT /api/notification-rules/{id}
     * Cập nhật rule.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $rule = NotificationRule::findOrFail($id);

        $validated = $request->validate([
            'property_id' => 'nullable|uuid|exists:properties,id',
            'trigger' => 'sometimes|string|max:100',
            'schedule' => 'nullable|array',
            'template_id' => 'sometimes|uuid|exists:notification_templates,id',
            'is_active' => 'boolean',
        ]);

        $rule->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Rule đã được cập nhật.',
            'data' => $rule->fresh()->load('template:id,code,channel,title'),
        ]);
    }

    /**
     * PATCH /api/notification-rules/{id}/toggle
     * Bật/tắt rule.
     */
    public function toggle(string $id): JsonResponse
    {
        $rule = NotificationRule::findOrFail($id);
        $rule->update(['is_active' => !$rule->is_active]);

        $status = $rule->is_active ? 'kích hoạt' : 'tắt';

        return response()->json([
            'success' => true,
            'message' => "Rule đã được {$status}.",
            'data' => ['is_active' => $rule->is_active],
        ]);
    }

    /**
     * DELETE /api/notification-rules/{id}
     */
    public function destroy(string $id): JsonResponse
    {
        $rule = NotificationRule::findOrFail($id);
        $rule->delete();

        return response()->json([
            'success' => true,
            'message' => 'Rule đã được xóa.',
        ]);
    }
}
