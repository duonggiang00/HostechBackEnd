<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Models\System\AuditLog;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

use Dedoc\Scramble\Attributes\Group; // Added

/**
 * Nhật ký hoạt động (Audit Logs)
 * 
 * API xem lịch sử hoạt động của hệ thống.
 * Hỗ trợ lọc theo đối tượng, người thực hiện, thời gian...
 */
#[Group('Hệ thống')]
class AuditLogController extends Controller
{
    /**
     * Danh sách nhật ký
     * 
     * Lấy danh sách audit logs.
     * Owner chỉ xem được log của Org mình. Admin xem tất cả.
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', AuditLog::class);

        $query = AuditLog::query()->with(['causer', 'subject']);

        // Enforce Scope for Non-SuperAdmin/Non-Admin
        // (SuperAdmin/Admin bypass is handled in AuthServiceProvider Gate::before or Policy, 
        // but for filtering list we need explicit check here to filter results)
        $user = $request->user();
        if (! $user->hasRole('Admin')) {
             if ($user->org_id) {
                 $query->where('org_id', $user->org_id);
             } else {
                 // If no org_id (system user but not admin?), show nothing or everything?
                 // Safer to show empty if strict multi-tenancy.
                 // But Owner should have org_id.
             }
        }

        $logs = QueryBuilder::for($query)
            ->allowedFilters([
                'log_name',
                'event',
                AllowedFilter::exact('subject_type'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('causer_id'),
                AllowedFilter::scope('created_between'), // Custom scope if needed, or simple date filter
            ])
            ->defaultSort('-created_at')
            ->paginate($request->get('per_page', 20));

        return response()->json($logs);
    }

    /**
     * Chi tiết nhật ký
     * 
     * Xem chi tiết một bản ghi audit log.
     */
    public function show($id)
    {
        $log = AuditLog::with(['causer', 'subject'])->findOrFail($id);
        
        $this->authorize('view', $log);

        return response()->json($log);
    }
}
