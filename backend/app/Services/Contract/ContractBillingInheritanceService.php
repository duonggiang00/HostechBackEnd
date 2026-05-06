<?php

namespace App\Services\Contract;

use App\Models\Contract\Contract;

class ContractBillingInheritanceService
{
    public function shouldIncludeInherited(?bool $override = null): bool
    {
        if ($override !== null) {
            return $override;
        }

        return filter_var(request()->input('include_inherited', false), FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * @return list<string>
     */
    public function resolveLineageContractIds(string $contractId, ?bool $includeInherited = null): array
    {
        if (! $this->shouldIncludeInherited($includeInherited)) {
            return [$contractId];
        }

        $contract = Contract::query()
            ->select(['id', 'meta'])
            ->find($contractId);

        if (! $contract) {
            return [$contractId];
        }

        return $contract->lineageContractIds();
    }
}
