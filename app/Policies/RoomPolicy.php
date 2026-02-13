<?php

namespace App\Policies;

use App\Contracts\RbacModuleProvider;
use App\Models\Room;
use App\Models\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\Response;

class RoomPolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Room';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'RU',
            'Tenant' => 'R',
        ];
    }

    public function viewAny(User $user): bool
    {
        if ($user->hasPermissionTo('viewAny Room')) {
            return true;
        }
        return false;
    }

    public function view(User $user, Room $room): bool
    {
        if (! $user->hasPermissionTo('view Room')) {
            return false;
        }

        if ($user->hasRole('Owner') || $user->hasRole('Manager') || $user->hasRole('Staff')) {
            return $this->checkOrgScope($user, $room);
        }

        if ($user->hasRole('Tenant')) {
            // Tenant can only view rooms they are assigned to (or just in their org for now, 
            // relying on existing logic which was "view rooms in their org")
            // The previous logic was: if ($user->hasRole('Tenant')) { return true; } 
            return $this->checkOrgScope($user, $room);
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Room');
    }

    public function update(User $user, Room $room): bool
    {
        if (! $user->hasPermissionTo('update Room')) {
            return false;
        }

        return $this->checkOrgScope($user, $room);
    }

    public function delete(User $user, Room $room): bool
    {
        if (! $user->hasPermissionTo('delete Room')) {
            return false;
        }

        return $this->checkOrgScope($user, $room);
    }
}
