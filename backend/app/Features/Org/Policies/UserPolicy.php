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
        return $user->can('viewAny Users');
    }

    public function view(User $user, User $model): bool
    {
        if ($user->can('view Users')) {
            return $this->checkOrgScope($user, $model);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('create Users');
    }

    public function update(User $user, User $model): bool
    {
        if ($user->can('update Users')) {
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

        if ($user->can('delete Users')) {
            return $this->checkOrgScope($user, $model);
        }

        return false;
    }
}
