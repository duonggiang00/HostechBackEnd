<?php

namespace App\Policies;

use App\Contracts\RbacModuleProvider;
use App\Models\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\Response;

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
            'Manager' => 'R',
            'Staff' => '-',
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
        if (! $user->hasPermissionTo('view Users')) {
            return false;
        }

        return $this->checkOrgScope($user, $model);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Users');
    }

    public function update(User $user, User $model): bool
    {
        if (! $user->hasPermissionTo('update Users')) {
            return false;
        }

        return $this->checkOrgScope($user, $model);
    }

    public function delete(User $user, User $model): bool
    {
        if (! $user->hasPermissionTo('delete Users')) {
            return false;
        }

        // Prevent deleting self? (Optional business logic)
        if ($user->id === $model->id) {
            return false;
        }

        return $this->checkOrgScope($user, $model);
    }
}
