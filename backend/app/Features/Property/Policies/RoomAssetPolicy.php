<?php

namespace App\Features\Property\Policies;

use App\Features\Org\Models\User;
use App\Features\Property\Models\RoomAsset;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class RoomAssetPolicy
{
    use HandlesAuthorization;
    use HandlesPropertyScope;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny RoomAssets');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, RoomAsset $roomAsset): bool
    {
        if (!$user->hasPermissionTo('view RoomAssets')) {
            return false;
        }

        return $this->checkPropertyScope($user, $roomAsset->room->property);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create RoomAssets');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, RoomAsset $roomAsset): bool
    {
        if (!$user->hasPermissionTo('update RoomAssets')) {
            return false;
        }

        return $this->checkPropertyScope($user, $roomAsset->room->property);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, RoomAsset $roomAsset): bool
    {
        if (!$user->hasPermissionTo('delete RoomAssets')) {
            return false;
        }

        return $this->checkPropertyScope($user, $roomAsset->room->property);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, RoomAsset $roomAsset): bool
    {
        return $user->hasPermissionTo('restore RoomAssets');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, RoomAsset $roomAsset): bool
    {
        return $user->hasPermissionTo('forceDelete RoomAssets');
    }
}
