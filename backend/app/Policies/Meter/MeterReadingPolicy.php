<?php

namespace App\Policies\Meter;

use App\Contracts\RbacModuleProvider;
use App\Models\Meter\MeterReading;
use App\Models\Org\User;

class MeterReadingPolicy implements RbacModuleProvider
{
    public static function getModuleName(): string
    {
        return 'MeterReading';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner'   => '*',
            'Manager' => ['viewAny', 'view', 'create', 'update', 'delete', 'approve', 'submit'],
            'Staff'   => ['viewAny', 'view', 'create', 'update', 'delete', 'submit'],
        ];
    }
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view MeterReading');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('view MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create MeterReading');
    }

    /**
     * Determine whether the user can update the model.
     * Only DRAFT or REJECTED readings can be edited.
     */
    public function update(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('update MeterReading')) {
            return false;
        }

        // Can only edit DRAFT or REJECTED readings
        if (! $meterReading->isEditable()) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Determine whether the user can delete the model.
     * Only DRAFT or REJECTED readings can be deleted.
     */
    public function delete(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        // Can only delete DRAFT or REJECTED readings
        if (! $meterReading->isEditable()) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Staff can submit their own DRAFT/REJECTED readings.
     */
    public function submit(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('create MeterReading')) {
            return false;
        }

        // Must be in submittable status
        if (! $meterReading->isSubmittable()) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Only Manager and Owner can approve/reject readings.
     */
    public function approve(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('approve MeterReading')) {
            return false;
        }

        // Only SUBMITTED readings can be approved/rejected
        if ($meterReading->status !== MeterReading::STATUS_SUBMITTED) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Check if the user has access to the meter's property.
     */
    protected function checkPropertyScope(User $user, MeterReading $meterReading): bool
    {
        $meter = $meterReading->meter;
        if (! $meter) {
            return false;
        }

        // Owner sees everything in their org
        if ($user->hasRole('Owner')) {
            return $meter->org_id === $user->org_id;
        }

        // Manager and Staff: check property assignment
        if ($meter->room && $meter->room->property_id) {
            return $meter->room->property->managers()
                ->where('user_id', $user->id)
                ->exists();
        }

        // Fallback to org-level check
        return $meter->org_id === $user->org_id;
    }
}
