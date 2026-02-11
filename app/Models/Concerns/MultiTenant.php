<?php

namespace App\Models\Concerns;

use App\Services\TenantManager;
use Illuminate\Database\Eloquent\Builder;

trait MultiTenant
{
    public static function bootMultiTenant(): void
    {
        static::addGlobalScope('org_id', function (Builder $builder) {
            $orgId = TenantManager::getOrgId();
            if ($orgId) {
                $builder->where($builder->getModel()->getTable().'.org_id', $orgId);
            }
        });
    }

    public function scopeForOrg(Builder $query, string $orgId): Builder
    {
        return $query->where($this->getTable().'.org_id', $orgId);
    }
}
