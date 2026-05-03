<?php

namespace App\Http\Middleware;

use App\Models\Property\Property;
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
        $propertyId = $request->header('X-Property-Id')
            ?: $request->get('property_id')
            ?: $request->input('filter.property_id')
            ?: $request->route('property_id')
            ?: $request->route('propertyId');
        if ($propertyId) {
            TenantManager::setPropertyId($propertyId);
        }

        // 3. Thiếu org (vd. Admin chỉ có X-Property-Id từ /properties/:id): suy org_id từ tòa
        if ($user && ! TenantManager::getOrgId() && $propertyId) {
            $resolvedOrgId = Property::withoutGlobalScope('org_id')
                ->whereKey($propertyId)
                ->value('org_id');
            if ($resolvedOrgId) {
                TenantManager::setOrgId($resolvedOrgId);
            }
        }

        return $next($request);
    }
}
