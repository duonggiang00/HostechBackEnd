<?php

namespace App\Features\Service\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Org\Models\User;
use App\Features\Service\Models\Service;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class ServicePolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Services';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'R',
            'Tenant' => 'R',
        ];
    }

    public function viewAny(User $user): bool
    {
        return $user->can('viewAny Services');
    }

    public function view(User $user, Service $service): bool
    {
        if (! $user->can('view Services')) {
            return false;
        }

        return $this->checkOrgScope($user, $service);
    }

    public function create(User $user): bool
    {
        return $user->can('create Services');
    }

    public function update(User $user, Service $service): bool
    {
        if (! $user->can('update Services')) {
            return false;
        }

        if (! $this->checkOrgScope($user, $service)) {
            return false;
        }

        // Owners and Admins can update any service in the Org
        if ($user->hasRole(['Admin', 'Owner'])) {
            return true;
        }

        // Managers and Staff can only update Local Services (property_id is NOT NULL)
        // AND they must be assigned to that property
        if ($user->hasRole(['Manager', 'Staff'])) {
            if (is_null($service->property_id)) {
                return false;
            }

            return $user->properties()->where('properties.id', $service->property_id)->exists();
        }

        return false;
    }

    public function delete(User $user, Service $service): bool
    {
        if (! $user->can('delete Services')) {
            return false;
        }

        if (! $this->checkOrgScope($user, $service)) {
            return false;
        }

        // Owners and Admins can delete any service in the Org
        if ($user->hasRole(['Admin', 'Owner'])) {
            return true;
        }

        // Managers and Staff can only delete Local Services (property_id is NOT NULL)
        // AND they must be assigned to that property
        if ($user->hasRole(['Manager', 'Staff'])) {
            if (is_null($service->property_id)) {
                return false;
            }

            return $user->properties()->where('properties.id', $service->property_id)->exists();
        }

        return false;
    }
}
