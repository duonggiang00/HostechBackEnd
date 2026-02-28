<?php

namespace App\Policies;

use App\Models\Handover;
use App\Models\Org\User;
use Illuminate\Auth\Access\Response;

class HandoverPolicy
{
    /**
     * Perform pre-authorization checks.
     */
    public function before(User $user, string $ability): bool|null
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return null; // fall through
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['owner', 'manager', 'staff', 'tenant']);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, \App\Models\Handover\Handover $handover): bool
    {
        if ($user->hasRole('owner')) {
            return $user->org_id === $handover->org_id;
        }
        
        if ($user->hasAnyRole(['manager', 'staff'])) {
            return $user->org_id === $handover->org_id; // in a real app, check property assignment
        }
        
        if ($user->hasRole('tenant')) {
            // Chỉ thấy biên bản đã Confirm gắn với hợp đồng thuê của họ
            return $handover->status === 'CONFIRMED' && $user->contracts()->where('id', $handover->contract_id)->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole(['owner', 'manager', 'staff']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, \App\Models\Handover\Handover $handover): bool
    {
        if ($handover->status === 'CONFIRMED') {
            return false;
        }
        
        if ($user->hasRole('owner')) {
             return $user->org_id === $handover->org_id;
        }

        if ($user->hasAnyRole(['manager', 'staff'])) {
             return $user->org_id === $handover->org_id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, \App\Models\Handover\Handover $handover): bool
    {
        if ($handover->status === 'CONFIRMED') {
            return false;
        }

        if ($user->hasRole('owner')) {
             return $user->org_id === $handover->org_id;
        }
        
        if ($user->hasRole('manager')) {
             return $user->org_id === $handover->org_id;
        }

        return false;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, \App\Models\Handover\Handover $handover): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, \App\Models\Handover\Handover $handover): bool
    {
        return false;
    }
}
