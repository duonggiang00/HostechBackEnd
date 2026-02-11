<?php

namespace App\Http\Middleware;

use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;

class ResolveTenant
{
    public function handle(Request $request, Closure $next)
    {
        // Resolve tenant from header `X-Org-Id` for now. Could be subdomain in future.
        $orgId = $request->header('X-Org-Id') ?: $request->get('org_id');
        if ($orgId) {
            TenantManager::setOrgId($orgId);
        }

        return $next($request);
    }
}
