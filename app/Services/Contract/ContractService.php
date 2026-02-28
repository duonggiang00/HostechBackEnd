<?php

namespace App\Services\Contract;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\User;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Illuminate\Support\Str;

class ContractService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null)
    {
        $query = QueryBuilder::for(Contract::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::scope('start_date_after', 'whereStartDateAfter'), // Needs scope in model or precise filter? Scramble usually likes simple. Let's start simple.
                // We'll stick to basic exact filters for now based on previous patterns.
            ]))
            ->allowedSorts(['start_date', 'end_date', 'created_at', 'status', 'rent_price'])
            ->defaultSort('-created_at')
            ->with(['room', 'property', 'members.user']);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('join_code', 'like', "%{$search}%")
                  ->orWhereHas('members.user', function ($uq) use ($search) {
                      $uq->where('full_name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null)
    {
        $query = QueryBuilder::for(Contract::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['start_date', 'end_date', 'created_at'])
            ->defaultSort('-created_at')
            ->with(['room', 'property']);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('join_code', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Contract
    {
        return Contract::with(['room', 'property', 'members.user', 'createdBy'])->find($id);
    }

    public function findTrashed(string $id): ?Contract
    {
        return Contract::onlyTrashed()->with(['room', 'property'])->find($id);
    }

    public function findWithTrashed(string $id): ?Contract
    {
        return Contract::withTrashed()->with(['room', 'property'])->find($id);
    }

    /**
     * Create Contract and potentially Members
     */
    public function create(array $data): Contract
    {
        return DB::transaction(function () use ($data) {
            // 1. Prepare Contract Data
            $contractData = collect($data)->except(['members'])->toArray();
            
            // Generate Join Code if not present? Or let Request handle it? 
            // Better to handle here if logic is consistent.
            if (! isset($contractData['join_code'])) {
                $contractData['join_code'] = $this->generateJoinCode();
            }

            // 2. Create Contract
            $contract = Contract::create($contractData);

            // 3. Handle Members (if passed in request, e.g. creating contract with tenant immediately)
            if (isset($data['members']) && is_array($data['members'])) {
                foreach ($data['members'] as $memberData) {
                    $this->addMember($contract, $memberData);
                }
            }

            return $contract;
        });
    }

    /**
     * Update Contract
     */
    public function update(string $id, array $data): ?Contract
    {
        $contract = $this->find($id);
        if (! $contract) return null;

        return DB::transaction(function () use ($contract, $data) {
            $contract->update($data);
            return $contract->refresh();
        });
    }

    public function delete(string $id): bool
    {
        $contract = $this->find($id);
        if ($contract) {
            return $contract->delete();
        }
        return false;
    }

    public function restore(string $id): bool
    {
        $contract = $this->findTrashed($id);
        if ($contract) {
            return $contract->restore();
        }
        return false;
    }

    public function forceDelete(string $id): bool
    {
        $contract = $this->findWithTrashed($id);
        if ($contract) {
            return $contract->forceDelete();
        }
        return false;
    }

    // Helpers

    public function addMember(Contract $contract, array $memberData): ContractMember
    {
        if (!empty($memberData['user_id']) && empty($memberData['full_name'])) {
            $user = User::find($memberData['user_id']);
            if ($user) {
                $memberData['full_name'] = $user->full_name;
                $memberData['phone'] = $memberData['phone'] ?? $user->phone;
            }
        }

        $joinedAt = array_key_exists('joined_at', $memberData) ? $memberData['joined_at'] : now();

        return ContractMember::create(array_merge($memberData, [
            'contract_id' => $contract->id,
            'org_id' => $contract->org_id,
            'joined_at' => $joinedAt,
        ]));
    }

    public function updateMember(string $contractId, string $memberId, array $data): ?ContractMember
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) return null;

        $member->update($data);
        return $member->refresh();
    }

    public function removeMember(string $contractId, string $memberId): bool
    {
        // We do a soft-remove by setting left_at, marking the termination of residency
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) return false;

        return $member->update(['left_at' => now()]);
    }

    private function generateJoinCode(): string
    {
        // Simple random string, ensure uniqueness logic if needed
        return strtoupper(Str::random(8));
    }
}
