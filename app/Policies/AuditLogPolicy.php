<?php

namespace App\Policies;

use App\Contracts\RbacModuleProvider;
use App\Models\AuditLog;
use App\Models\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class AuditLogPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'AuditLog';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'R', // Owner can Read
            'Manager' => '-', // No access
            'Staff' => '-',
            'Tenant' => '-',
        ];
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny AuditLog');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, AuditLog $auditLog): bool
    {
        if (! $user->hasPermissionTo('view AuditLog')) {
            return false;
        }

        // Check Org Scope using the Trait
        // Note: activity_log table has 'org_id' now
        return $this->checkOrgScope($user, $auditLog);
    }
}
