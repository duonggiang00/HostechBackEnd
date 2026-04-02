<?php

namespace App\Features\Property\Policies;

use App\Features\Org\Models\User;
use App\Features\Property\Models\Floor;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class FloorPolicy
{
    use HandlesAuthorization;
    use HandlesPropertyScope;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Floors');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Floor $floor): bool
    {
        if (!$user->hasPermissionTo('view Floors')) {
            return false;
        }

        return $this->checkPropertyScope($user, $floor->property);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Floors');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Floor $floor): bool
    {
        if (!$user->hasPermissionTo('update Floors')) {
            return false;
        }

        return $this->checkPropertyScope($user, $floor->property);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Floor $floor): bool
    {
        if (!$user->hasPermissionTo('delete Floors')) {
            return false;
        }

        return $this->checkPropertyScope($user, $floor->property);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Floor $floor): bool
    {
        return $user->hasPermissionTo('restore Floors');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Floor $floor): bool
    {
        return $user->hasPermissionTo('forceDelete Floors');
    }
}
