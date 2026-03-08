<?php

namespace App\Traits;

use App\Models\Org\User;
use Illuminate\Database\Eloquent\Model;

trait HandlesPropertyScope
{
    /**
     * Check if user can access the model within a property scope.
     * Uses the property_user pivot table for Managers and Staff.
     */
    protected function checkPropertyScope(User $user, Model $model): bool
    {
        // 1. Must be in the same organization
        if ((string) $user->org_id !== (string) $model->org_id) {
            return false;
        }

        // 2. Admins and Owners have access to all properties in their org
        if ($user->hasRole('Admin') || $user->hasRole('Owner')) {
            return true;
        }

        // 3. Managers and Staff must be specifically assigned to this property
        if ($user->hasRole(['Manager', 'Staff'])) {
            $propertyId = null;

            if ($model instanceof \App\Models\Property\Property) {
                $propertyId = $model->id;
            } elseif (! empty($model->property_id)) {
                $propertyId = $model->property_id;
            } elseif (! empty($model->room_id) && $model->room) {
                $propertyId = $model->room->property_id;
            } elseif (! empty($model->meter_id) && $model->meter && $model->meter->room) {
                $propertyId = $model->meter->room->property_id;
            }

            if (! $propertyId) {
                return false;
            }

            return $user->properties()->where('property_id', $propertyId)->exists();
        }

        // 4. Default deny for others (e.g., Tenants - their policies handle specific logic)
        return false;
    }
}
