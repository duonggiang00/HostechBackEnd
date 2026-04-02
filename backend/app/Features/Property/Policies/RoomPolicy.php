<?php

namespace App\Features\Property\Policies;

use App\Features\Org\Models\User;
use App\Features\Property\Models\Room;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class RoomPolicy
{
    use HandlesAuthorization;
    use HandlesPropertyScope;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Rooms');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Room $room): bool
    {
        if (!$user->hasPermissionTo('view Rooms')) {
            return false;
        }

        return $this->checkPropertyScope($user, $room->property);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Rooms');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Room $room): bool
    {
        if (!$user->hasPermissionTo('update Rooms')) {
            return false;
        }

        return $this->checkPropertyScope($user, $room->property);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Room $room): bool
    {
        if (!$user->hasPermissionTo('delete Rooms')) {
            return false;
        }

        return $this->checkPropertyScope($user, $room->property);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Room $room): bool
    {
        return $user->hasPermissionTo('restore Rooms');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Room $room): bool
    {
        return $user->hasPermissionTo('forceDelete Rooms');
    }
}
