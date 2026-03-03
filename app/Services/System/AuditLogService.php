<?php

namespace App\Services\System;

use App\Models\System\AuditLog;
use App\Models\Org\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AuditLogService
{
    /**
     * Paginate audit logs with role-based scoping
     */
    public function paginate(User $user, int $perPage = 20): LengthAwarePaginator
    {
        $query = AuditLog::query()->with(['causer', 'subject']);

        // Role-based scoping
        if (! $user->hasRole('Admin')) {
            // Managers, Owners, etc. only see logs within their organization
            $query->where('org_id', $user->org_id);
        }

        return QueryBuilder::for($query)
            ->allowedFilters([
                'log_name',
                'event',
                AllowedFilter::exact('subject_type'),
                AllowedFilter::exact('subject_id'),
                AllowedFilter::exact('causer_id'),
            ])
            ->defaultSort('-created_at')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Find a specific audit log entry
     */
    public function find(string $id): ?AuditLog
    {
        return AuditLog::with(['causer', 'subject'])->find($id);
    }
}
