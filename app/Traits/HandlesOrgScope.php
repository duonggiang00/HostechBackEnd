<?php

namespace App\Traits;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait HandlesOrgScope
{
    /**
     * Check if user can access the model within their organization.
     *
     * @param  User  $user
     * @param  Model  $model Matches valid models with org_id
     * @return bool
     */
    protected function checkOrgScope(User $user, Model $model): bool
    {
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        return $user->org_id === $model->org_id;
    }

    /**
     * Check if user is an Owner of the organization.
     */
    protected function isOwner(User $user): bool
    {
        return $user->hasRole('Owner');
    }

    protected function isManager(User $user): bool
    {
        return $user->hasRole('Manager');
    }

    protected function isStaff(User $user): bool
    {
        return $user->hasRole('Staff');
    }
}
