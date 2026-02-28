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
            'Manager' => 'CRUD', // Manager dealing with contracts? Likely yes.
            'Staff' => 'R',
            // 'Tenant' => 'R', // Removed standard 'R' to prevent global view. Access is handled via specific Policy method (membership).
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
        // Special case: Tenant viewing their own contract?
        // For now, rely on standard permissions + Org Scope.
        // If user is a tenant in the contract (linked via user_id in members), they should see it.
        // BUT strict RBAC first:
        // Check if user has global View permission
        if ($user->hasPermissionTo('view Contracts')) {
             return $this->checkOrgScope($user, $contract);
        }

        // Strict Tenant logic: Can view if they are a member of the contract
        // We assume Tenants might NOT have 'view Contracts' permission if we want to strict scope, 
        // OR we rely on this method returning true if they are members.
        // However, if they have 'view Contracts' (from 'R' role), the above block returns true for ALL contracts in Org.
        // So we need to refine the logic:
        // If User is Tenant (and not Staff/Manager/Owner/Admin), strict check.
        
        // Better approach:
        // 1. Admin/Owner/Manager/Staff -> via Permission 'view Contracts' + OrgScope.
        // 2. Tenant -> via Membership.
        
        // But RBACSeeder assigns 'view Contracts' to 'Tenant' role because of 'R'.
        // We should probably REMOVE 'view Contracts' from Tenant role in Policy definition if we want strict membership check,
        // OR we check roles here. Checking roles in Policy is coupled but effective.
        
        // Let's check membership first. If member, allow.
        $isMember = $contract->members()->where('user_id', $user->id)->exists();
        if ($isMember) return true;

        // If not member, check standard permission BUT filter for Tenants?
        // If Tenant has 'view Contracts', they see all.
        // We should change 'Tenant' => 'R' to something else or Handle it.
        
        // Let's change getRolePermissions to NOT give 'view Contracts' to Tenant?
        // But 'R' is convenient. 
        
        // Let's stick to:
        // If user has 'view Contracts' AND is NOT just a Tenant... 
        // Actually, if we want "Tenant only views OWN contract", they should NOT have 'view Contracts' permission for the whole module.
        // They should have a custom permission or just rely on this Policy method returning true for members.
        
        if ($user->hasPermissionTo('view Contracts')) {
            // Refine: If user ONLY has Tenant role, deny unless member?
            // "tenant chỉ có quyền xem contract của phòng họ"
            
            // If we trust RBAC, 'view Contracts' means VIEW ALL (in Org).
            // So Tenant should NOT have 'view Contracts'.
            
            return $this->checkOrgScope($user, $contract);
        }

        return false;
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
        // Manager/Owner/Staff
        if ($user->hasPermissionTo('update Contracts')) {
            return $this->checkOrgScope($user, $contract);
        }
        
        // Tenant (if they are a member of the contract)
        return $contract->members()->where('user_id', $user->id)->exists();
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
