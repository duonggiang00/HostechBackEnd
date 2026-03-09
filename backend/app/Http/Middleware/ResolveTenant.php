<?php

namespace App\Http\Middleware;

use App\Services\TenantManager;
use Closure;
use Illuminate\Http\Request;

class ResolveTenant
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // 1. Force org_id from authenticated user if they are not an Admin
        if ($user && ! $user->hasRole('Admin')) {
            if ($user->org_id) {
                TenantManager::setOrgId($user->org_id);
            }
        } else {
            // 2. Fallback to header/request 'org_id' for Admins or guests
            $orgId = $request->header('X-Org-Id') ?: $request->get('org_id');
            if ($orgId) {
                TenantManager::setOrgId($orgId);
            }
        }

        return $next($request);
    }
}
