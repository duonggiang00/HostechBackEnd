<?php

namespace App\Policies;

use App\Models\Property;
use App\Models\User;

class PropertyPolicy
{
    /**
     * Determine if the user can view properties list
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
     * Determine if the user can view a specific property
     */
    public function view(User $user, Property $property): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        if ($user->org_id !== $property->org_id) {
            return false;
        }

        // Owner: all properties in org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager & Staff: properties in their org
        if ($user->hasRole('Manager') || $user->hasRole('Staff')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can create properties
     */
    public function create(User $user): bool
    {
        // Admin and Owner can create
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin') || $user->hasRole('Owner')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can update a property
     */
    public function update(User $user, Property $property): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        if ($user->org_id !== $property->org_id) {
            return false;
        }

        // Owner: all properties in org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager: properties in org
        if ($user->hasRole('Manager')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can delete a property
     */
    public function delete(User $user, Property $property): bool
    {
        // Admin and Owner can delete
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner in same org
        if ($user->hasRole('Owner') && $user->org_id === $property->org_id) {
            return true;
        }

        return false;
    }
}
