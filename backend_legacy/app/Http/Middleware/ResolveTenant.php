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

        // 1. Resolve Organization ID
        if ($user && ! $user->hasRole('Admin')) {
            if ($user->org_id) {
                TenantManager::setOrgId($user->org_id);
            }
        } else {
            $orgId = $request->header('X-Org-Id') ?: $request->get('org_id');
            if ($orgId) {
                TenantManager::setOrgId($orgId);
            }
        }

        // 2. Resolve Property ID
        $propertyId = $request->header('X-Property-Id') ?: $request->get('property_id');
        if ($propertyId) {
            TenantManager::setPropertyId($propertyId);
        }

        return $next($request);

        return $next($request);
    }
}
