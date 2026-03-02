<?php

namespace App\Services\Contract;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ContractService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = QueryBuilder::for(Contract::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
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

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
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
    public function create(array $data, ?User $user = null): Contract
    {
        return DB::transaction(function () use ($data, $user) {
            $contractData = collect($data)->except(['members'])->toArray();

            // Auto-assign org_id if missing. Admin can pass it, others use their own.
            if (! isset($contractData['org_id'])) {
                $contractData['org_id'] = $user?->org_id;
            }

            $contractData['created_by_user_id'] = $user?->id;

            if (! isset($contractData['join_code'])) {
                $contractData['join_code'] = $this->generateJoinCode();
            }

            $contract = Contract::create($contractData);

            if (isset($data['members']) && is_array($data['members'])) {
                foreach ($data['members'] as $memberData) {
                    // Members created during contract setup are approved by default
                    $this->addMember($contract, array_merge($memberData, [
                        'status' => 'APPROVED',
                    ]), $user);
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
        if (! $contract) {
            return null;
        }

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

    /**
     * Accept Contract Signature (Tenant)
     */
    public function acceptSignature(Contract $contract, User $user): bool
    {
        $member = ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->first();

        if (! $member) {
            return false;
        }

        return DB::transaction(function () use ($contract, $member) {
            $member->update([
                'status' => 'APPROVED',
                'joined_at' => now(),
            ]);

            if (in_array($contract->status, ['DRAFT', 'PENDING_SIGNATURE'])) {
                $contract->update([
                    'status' => 'ACTIVE',
                    'signed_at' => now(),
                ]);
            }

            return true;
        });
    }

    /**
     * Reject Contract Signature (Tenant)
     */
    public function rejectSignature(Contract $contract, User $user): bool
    {
        $member = ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->first();

        if (! $member) {
            return false;
        }

        return $member->update(['status' => 'REJECTED']);
    }

    /**
     * Logic for listing contracts pending signature for a specific user
     */
    public function myPendingContracts(User $user): \Illuminate\Database\Eloquent\Collection
    {
        return Contract::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id)
                ->where('status', 'PENDING');
        })->with('property:id,name', 'room:id,code,name')->get();
    }

    /**
     * Get available rooms for transfer within the same property
     */
    public function getAvailableRoomsForTransfer(Contract $contract): \Illuminate\Database\Eloquent\Collection
    {
        return \App\Models\Property\Room::where('property_id', $contract->property_id)
            ->where('status', 'AVAILABLE')
            ->where('id', '!=', $contract->room_id)
            ->select(['id', 'code', 'name', 'type', 'area', 'base_price', 'floor', 'capacity'])
            ->get();
    }

    /**
     * Request a room transfer
     */
    public function requestRoomTransfer(Contract $contract, User $user, array $data): bool
    {
        $targetRoom = \App\Models\Property\Room::where('id', $data['target_room_id'])
            ->where('property_id', $contract->property_id)
            ->where('status', 'AVAILABLE')
            ->first();

        if (! $targetRoom) {
            return false;
        }

        $transferRequests = $contract->meta['transfer_requests'] ?? [];
        $transferRequests[] = [
            'requested_by' => $user->id,
            'from_room_id' => $contract->room_id,
            'to_room_id' => $targetRoom->id,
            'reason' => $data['reason'] ?? null,
            'status' => 'PENDING',
            'requested_at' => now()->toISOString(),
        ];

        return $contract->update([
            'meta' => array_merge($contract->meta ?? [], ['transfer_requests' => $transferRequests]),
        ]);
    }

    /**
     * General Add Member logic.
     * Status defaults to APPROVED for Managers, PENDING for others (Tenants).
     */
    public function addMember(Contract $contract, array $memberData, ?User $performer = null): ContractMember
    {
        // 1. Resolve User Details
        if (! empty($memberData['user_id']) && empty($memberData['full_name'])) {
            $user = User::find($memberData['user_id']);
            if ($user) {
                $memberData['full_name'] = $user->full_name;
                $memberData['phone'] = $memberData['phone'] ?? $user->phone;
            }
        }

        // 2. Intelligent Status Mapping
        if (! isset($memberData['status'])) {
            // If performer is Manager/Owner/Admin, approve immediately
            if ($performer && ($performer->hasRole(['Admin', 'Owner', 'Manager', 'Staff']))) {
                $memberData['status'] = 'APPROVED';
            } else {
                $memberData['status'] = 'PENDING';
            }
        }

        // 3. Date Handling
        $joinedAt = null;
        if ($memberData['status'] === 'APPROVED') {
            $joinedAt = $memberData['joined_at'] ?? now();
        }

        return ContractMember::create(array_merge($memberData, [
            'contract_id' => $contract->id,
            'org_id' => $contract->org_id,
            'joined_at' => $joinedAt,
        ]));
    }

    public function updateMember(string $contractId, string $memberId, array $data): ?ContractMember
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return null;
        }

        $member->update($data);

        return $member->refresh();
    }

    public function removeMember(string $contractId, string $memberId): bool
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return false;
        }

        return $member->update(['left_at' => now()]);
    }

    public function approveMember(string $contractId, string $memberId): ?ContractMember
    {
        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member || $member->status === 'APPROVED') {
            return null;
        }

        $member->update([
            'status' => 'APPROVED',
            'joined_at' => now(),
        ]);

        return $member->refresh();
    }

    private function generateJoinCode(): string
    {
        return strtoupper(Str::random(8));
    }
}
