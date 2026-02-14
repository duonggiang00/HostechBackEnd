<?php

namespace App\Policies;

use App\Contracts\RbacModuleProvider;
use App\Models\Org;
use App\Models\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\Response;

class OrgPolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Orgs';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => '-',
            'Staff' => '-',
            'Tenant' => '-',
        ];
    }

    public function viewAny(User $user): bool
    {
        if ($user->hasPermissionTo('viewAny Orgs')) {
            return true;
        }
        return false;
    }

    public function view(User $user, Org $org): bool
    {
        if (! $user->hasPermissionTo('view Orgs')) {
            return false;
        }

        // Owner can only view their own org
        if ($user->hasRole('Owner')) {
            return (string) $user->org_id === (string) $org->id;
        }

        return $this->checkOrgScope($user, $org);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Orgs');
    }

    public function update(User $user, Org $org): bool
    {
        if (! $user->hasPermissionTo('update Orgs')) {
            return false;
        }

        if ($user->hasRole('Owner')) {
            return (string) $user->org_id === (string) $org->id;
        }

        return $this->checkOrgScope($user, $org);
    }

    public function delete(User $user, Org $org): bool
    {
        if (! $user->hasPermissionTo('delete Orgs')) {
            return false;
        }

        // Owner can only delete their own org (if they have permission)
        if ($user->hasRole('Owner')) {
            return (string) $user->org_id === (string) $org->id;
        }

        return $this->checkOrgScope($user, $org);
    }
}
