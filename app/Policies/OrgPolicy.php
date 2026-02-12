<?php

namespace App\Policies;

use App\Models\Org;
use App\Models\User;

class OrgPolicy
{
    /**
     * Determine if the user can view organizations list
     */
    public function viewAny(User $user): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: can view their own org
        if ($user->hasRole('Owner') && $user->org_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can view a specific organization
     */
    public function view(User $user, Org $org): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: only their own org
        if ($user->hasRole('Owner') && $user->org_id === $org->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can create organizations
     */
    public function create(User $user): bool
    {
        // Only Admin can create orgs
        return $user->hasRole('SuperAdmin') || $user->hasRole('Admin');
    }

    /**
     * Determine if the user can update an organization
     */
    public function update(User $user, Org $org): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner: only their own org
        if ($user->hasRole('Owner') && $user->org_id === $org->id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can delete an organization
     */
    public function delete(User $user, Org $org): bool
    {
        // Only Admin can delete orgs
        return $user->hasRole('SuperAdmin') || $user->hasRole('Admin');
    }
}
