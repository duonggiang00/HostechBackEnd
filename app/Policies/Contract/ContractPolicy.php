<?php

namespace App\Policies\Contract;

use App\Contracts\RbacModuleProvider;
use App\Models\Contract\Contract;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class ContractPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Contracts';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'R',
            'Tenant' => 'R', // Standard 'R' gives 'view Contracts', we scope it in view()
        ];
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Contracts');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Contract $contract): bool
    {
        // 1. Staff/Manager/Owner -> via Permission + OrgScope
        if ($user->hasPermissionTo('view Contracts') && ! $user->hasRole('Tenant')) {
            return $this->checkOrgScope($user, $contract);
        }

        // 2. Tenant (and others) -> via Membership
        return $contract->members()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Contracts');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Contract $contract): bool
    {
        if (! $user->hasPermissionTo('update Contracts')) {
            return false;
        }

        return $this->checkOrgScope($user, $contract);
    }

    /**
     * Determine whether the user can add members to the contract.
     */
    public function addMember(User $user, Contract $contract): bool
    {
        // Manager/Owner/Staff -> Can add to any contract in Org
        if ($user->hasPermissionTo('update Contracts')) {
            return $this->checkOrgScope($user, $contract);
        }

        // Tenant -> Can only add to their OWN contract
        return $contract->members()
            ->where('user_id', $user->id)
            ->where('status', 'APPROVED')
            ->exists();
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Contract $contract): bool
    {
        if (! $user->hasPermissionTo('delete Contracts')) {
            return false;
        }

        return $this->checkOrgScope($user, $contract);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Contract $contract): bool
    {
        if (! $user->hasPermissionTo('delete Contracts')) { // Restore usually maps to delete permission or specialized one
            return false;
        }

        return $this->checkOrgScope($user, $contract);
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Contract $contract): bool
    {
        // Force delete might be restricted to Admin or Owner
        if (! $user->hasPermissionTo('delete Contracts')) {
            return false;
        }
        // In some systems force delete is separate. Adhering to standard for now.

        return $this->checkOrgScope($user, $contract);
    }
}
