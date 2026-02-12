<?php

namespace App\Policies;

use App\Models\Room;
use App\Models\User;

class RoomPolicy
{
    /**
     * Determine if the user can view rooms list
     */
    public function viewAny(User $user): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner, Manager, Staff, Tenant can view in their org
        if ($user->org_id) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can view a specific room
     */
    public function view(User $user, Room $room): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        if ($user->org_id !== $room->org_id) {
            return false;
        }

        // Owner: all rooms in org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager & Staff: rooms in their org
        if ($user->hasRole('Manager') || $user->hasRole('Staff')) {
            return true;
        }

        // Tenant: can view rooms in their org (read-only)
        if ($user->hasRole('Tenant')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can create rooms
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
     * Determine if the user can update a room
     */
    public function update(User $user, Room $room): bool
    {
        // Admin: all
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Must be in same org
        if ($user->org_id !== $room->org_id) {
            return false;
        }

        // Owner: all rooms in org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // Manager: rooms in org
        if ($user->hasRole('Manager')) {
            return true;
        }

        // Staff: can update rooms in org
        if ($user->hasRole('Staff')) {
            return true;
        }

        return false;
    }

    /**
     * Determine if the user can delete a room
     */
    public function delete(User $user, Room $room): bool
    {
        // Admin and Owner can delete
        if ($user->hasRole('SuperAdmin') || $user->hasRole('Admin')) {
            return true;
        }

        // Owner in same org
        if ($user->hasRole('Owner') && $user->org_id === $room->org_id) {
            return true;
        }

        // Manager in same org
        if ($user->hasRole('Manager') && $user->org_id === $room->org_id) {
            return true;
        }

        return false;
    }
}
