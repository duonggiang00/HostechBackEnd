<?php

namespace App\Features\System\Controllers;

use App\Http\Controllers\Controller;
use App\Features\System\Requests\AuditLogIndexRequest;
use App\Features\System\Resources\AuditLogResource;
use App\Features\System\Models\AuditLog;
use App\Features\System\Services\AuditLogService;
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
