<?php

namespace App\Policies\Property;

use App\Contracts\RbacModuleProvider;
use App\Models\Property\Room;
use App\Models\Org\User;
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

        if ($user->hasRole('Tenant')) {
            // Tenant chỉ được xem chi tiết phòng nếu có Contract ACTIVE với APPROVED membership
            return \App\Models\Contract\Contract::where('room_id', $room->id)
                ->where('status', 'ACTIVE')
                ->whereHas('members', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->where('status', 'APPROVED');
                })
                ->exists();
        }

        return $this->checkOrgScope($user, $room);
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
