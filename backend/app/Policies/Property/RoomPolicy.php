<?php

namespace App\Policies\Property;

use App\Contracts\RbacModuleProvider;
use App\Models\Org\User;
use App\Models\Property\Room;
use App\Traits\HandlesPropertyScope;

class RoomPolicy implements RbacModuleProvider
{
    use HandlesPropertyScope;

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
        // Scoping Pattern: Staff/Manager gets standard permission check + Property Scope
        if ($user->hasPermissionTo('view Room') && ! $user->hasRole('Tenant')) {
            return $this->checkPropertyScope($user, $room);
        }

        // Scoping Pattern: Tenant gets Membership check OR room is available
        return $room->status === 'available' || \App\Models\Contract\Contract::where('room_id', $room->id)
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

        return $this->checkPropertyScope($user, $room);
    }

    public function delete(User $user, Room $room): bool
    {
        if (! $user->hasPermissionTo('delete Room')) {
            return false;
        }

        return $this->checkPropertyScope($user, $room);
    }

    public function deleteAny(User $user): bool
    {
        return $user->hasPermissionTo('deleteAny Room');
    }

    public function restoreAny(User $user): bool
    {
        return $user->hasPermissionTo('restoreAny Room');
    }

    public function forceDeleteAny(User $user): bool
    {
        return $user->hasPermissionTo('forceDeleteAny Room');
    }

    public function updateAny(User $user): bool
    {
        return $user->hasPermissionTo('updateAny Room');
    }

    public function publish(User $user, Room $room): bool
    {
        // Chỉ Owner, Manager và Admin mới được publish phòng
        if (! $user->hasPermissionTo('update Room')) {
            return false;
        }

        return $this->checkPropertyScope($user, $room);
    }
}
