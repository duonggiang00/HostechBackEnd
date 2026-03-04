<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\AuditLogIndexRequest;
use App\Http\Resources\System\AuditLogResource;
use App\Models\System\AuditLog;
use App\Services\System\AuditLogService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Hoạt động hệ thống (Audit Logs)
 */
#[Group('Hệ thống')]
class AuditLogController extends Controller
{
    public function __construct(protected AuditLogService $service) {}

    /**
     * Danh sách nhật ký
     */
    public function index(AuditLogIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', AuditLog::class);

        $paginator = $this->service->paginate(
            user: $request->user(),
            perPage: (int) $request->input('per_page', 20)
        );

        return AuditLogResource::collection($paginator);
    }

    /**
     * Chi tiết nhật ký
     */
    public function show(string $id): AuditLogResource
    {
        $log = $this->service->find($id);
        if (! $log) {
            abort(404, 'Audit Log Entry Not Found');
        }

        $this->authorize('view', $log);

        return new AuditLogResource($log);
    }
}
