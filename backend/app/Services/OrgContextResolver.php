<?php

namespace App\Services;

use App\Models\Org\User;
use Illuminate\Http\Request;

/**
 * Resolves org_id for list endpoints (TenantManager, headers, query, then user.org_id).
 */
class OrgContextResolver
{
    public static function resolveOrgId(?User $user = null, ?Request $request = null): ?string
    {
        $request ??= request();
        $user ??= $request->user();

        if ($fromContext = TenantManager::getOrgId()) {
            return (string) $fromContext;
        }

        $headerOrQuery = $request->header('X-Org-Id') ?: $request->input('org_id');
        if ($headerOrQuery) {
            return (string) $headerOrQuery;
        }

        $filterOrg = $request->input('filter.org_id');
        if ($filterOrg !== null && $filterOrg !== '') {
            return (string) $filterOrg;
        }

        return $user?->org_id ? (string) $user->org_id : null;
    }
}
