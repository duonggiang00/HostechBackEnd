<?php

namespace App\Features\Org\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Org\Models\User;
use App\Traits\HandlesOrgScope;

class UserPolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Users';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'R',
            'Tenant' => '-',
        ];
    }

    public function viewAny(User $user): bool
    {
        if ($user->hasPermissionTo('viewAny Users')) {
            return true;
        }

        return false;
    }

    public function view(User $user, User $model): bool
    {
        if ($user->hasRole(['Admin', 'ADMIN', 'Owner', 'OWNER', 'Manager', 'MANAGER']) || $user->hasPermissionTo('view Users')) {
            return $this->checkOrgScope($user, $model);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['Admin', 'ADMIN', 'Owner', 'OWNER', 'Manager', 'MANAGER']) || $user->hasPermissionTo('create Users');
    }

    public function update(User $user, User $model): bool
    {
        if ($user->hasRole(['Admin', 'ADMIN', 'Owner', 'OWNER', 'Manager', 'MANAGER']) || $user->hasPermissionTo('update Users')) {
            return $this->checkOrgScope($user, $model);
        }

        return false;
    }

    public function delete(User $user, User $model): bool
    {
        // Prevent deleting self? (Optional business logic)
        if ($user->id === $model->id) {
            return false;
        }

        if ($user->hasRole(['Admin', 'ADMIN', 'Owner', 'OWNER', 'Manager', 'MANAGER']) || $user->hasPermissionTo('delete Users')) {
            return $this->checkOrgScope($user, $model);
        }

        return false;
    }
}
