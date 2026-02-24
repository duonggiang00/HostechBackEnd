<?php

namespace App\Policies\Service;

use App\Contracts\RbacModuleProvider;
use App\Models\Service\Service;
use App\Models\Org\User;
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
        return $user->hasPermissionTo('viewAny Services');
    }

    public function view(User $user, Service $service): bool
    {
        if (! $user->hasPermissionTo('view Services')) {
            return false;
        }
        return $this->checkOrgScope($user, $service);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Services');
    }

    public function update(User $user, Service $service): bool
    {
        if (! $user->hasPermissionTo('update Services')) {
            return false;
        }
        return $this->checkOrgScope($user, $service);
    }

    public function delete(User $user, Service $service): bool
    {
        if (! $user->hasPermissionTo('delete Services')) {
            return false;
        }
        return $this->checkOrgScope($user, $service);
    }
}
