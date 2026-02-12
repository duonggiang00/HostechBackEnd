<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine if the user can view users list
     */
    public function viewAny(User $user): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: users in same org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager: can view users in same org
        if ($user->hasRole('Manager')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can view a specific user
     */
    public function view(User $user, User $model): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: only users in same org
        if ($user->hasRole('Owner') && $user->org_id === $model->org_id) {
            return true;
        }

        // Manager: can view users in same org
        if ($user->hasRole('Manager') && $user->org_id === $model->org_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can create users
     */
    public function create(User $user): bool
    {
        // Only Admin and Owner can create users
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin') || $user->hasRole('Owner')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can update a user
     */
    public function update(User $user, User $model): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: only users in same org
        if ($user->hasRole('Owner') && $user->org_id === $model->org_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can delete a user
     */
    public function delete(User $user, User $model): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: only users in same org
        if ($user->hasRole('Owner') && $user->org_id === $model->org_id) {
            return true;
        }

        return false;
    }
}
