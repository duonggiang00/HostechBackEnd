<?php

namespace App\Policies;

use App\Models\Floor;
use App\Models\User;

class FloorPolicy
{
    /**
     * Determine if the user can view floors list
     */
    public function viewAny(User $user): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner, Manager, Staff can view in their org
        if ($user->hasRole('Owner') || $user->hasRole('Manager') || $user->hasRole('Staff')) {
            return $user->org_id !== null;
        }

        return false;
    }

    /**
     * Determine if the user can view a specific floor
     */
    public function view(User $user, Floor $floor): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        if ($user->org_id !== $floor->org_id) {
            return false;
        }

        // Owner: all floors in org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager & Staff: floors in their org
        if ($user->hasRole('Manager') || $user->hasRole('Staff')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can create floors
     */
    public function create(User $user): bool
    {
        // Admin, Owner, Manager can create
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin') || $user->hasRole('Owner') || $user->hasRole('Manager')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can update a floor
     */
    public function update(User $user, Floor $floor): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        if ($user->org_id !== $floor->org_id) {
            return false;
        }

        // Owner: all floors in org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager: floors in org
        if ($user->hasRole('Manager')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can delete a floor
     */
    public function delete(User $user, Floor $floor): bool
    {
        // Admin and Owner can delete
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner in same org
        if ($user->hasRole('Owner') && $user->org_id === $floor->org_id) {
            return true;
        }

        // Manager in same org
        if ($user->hasRole('Manager') && $user->org_id === $floor->org_id) {
            return true;
        }

        return false;
    }
}
