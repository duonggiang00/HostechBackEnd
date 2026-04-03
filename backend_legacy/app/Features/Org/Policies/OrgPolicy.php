<?php

namespace App\Features\Org\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Org\Models\Org;
use App\Features\Org\Models\User;
use App\Traits\HandlesOrgScope;

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
        return $user->can('viewAny Orgs');
    }

    public function view(User $user, Org $org): bool
    {
        // Users can always view their own organization
        if ((string) $user->org_id === (string) $org->id) {
            return true;
        }

        if (! $user->can('view Orgs')) {
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
        return $user->can('create Orgs');
    }

    public function update(User $user, Org $org): bool
    {
        if (! $user->can('update Orgs')) {
            return false;
        }

        if ($user->hasRole('Owner')) {
            return (string) $user->org_id === (string) $org->id;
        }

        return $this->checkOrgScope($user, $org);
    }

    public function delete(User $user, Org $org): bool
    {
        if (! $user->can('delete Orgs')) {
            return false;
        }

        // Owner can only delete their own org (if they have permission)
        if ($user->hasRole('Owner')) {
            return (string) $user->org_id === (string) $org->id;
        }

        return $this->checkOrgScope($user, $org);
    }
}
