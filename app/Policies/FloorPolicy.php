<?php

namespace App\Policies;

use App\Contracts\RbacModuleProvider;
use App\Models\Floor;
use App\Models\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\Response;

class FloorPolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Floor';
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
        if ($user->hasPermissionTo('viewAny Floor')) {
            return true;
        }
        return false;
    }

    public function view(User $user, Floor $floor): bool
    {
        if (! $user->hasPermissionTo('view Floor')) {
            return false;
        }

        return $this->checkOrgScope($user, $floor);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Floor');
    }

    public function update(User $user, Floor $floor): bool
    {
        if (! $user->hasPermissionTo('update Floor')) {
            return false;
        }

        return $this->checkOrgScope($user, $floor);
    }

    public function delete(User $user, Floor $floor): bool
    {
        if (! $user->hasPermissionTo('delete Floor')) {
            return false;
        }

        return $this->checkOrgScope($user, $floor);
    }
}
