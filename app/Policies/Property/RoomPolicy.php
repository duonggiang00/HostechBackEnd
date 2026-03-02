<?php

namespace App\Policies\Property;

use App\Contracts\RbacModuleProvider;
use App\Models\Org\User;
use App\Models\Property\Room;
use App\Traits\HandlesOrgScope;

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
        // Scoping Pattern: Staff/Manager gets standard permission check + Org Scope
        if ($user->hasPermissionTo('view Room') && ! $user->hasRole('Tenant')) {
            return $this->checkOrgScope($user, $room);
        }

        // Scoping Pattern: Tenant gets Membership check
        return \App\Models\Contract\Contract::where('room_id', $room->id)
            ->where('status', 'ACTIVE')
            ->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('status', 'APPROVED');
            })
            ->exists();
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
