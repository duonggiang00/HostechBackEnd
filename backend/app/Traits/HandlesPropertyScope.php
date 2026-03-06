<?php

namespace App\Traits;

use App\Models\Org\User;
use Illuminate\Database\Eloquent\Model;

trait HandlesPropertyScope
{
    /**
     * Check if user can access the model within a property scope.
     * note: currently assuming property-level access is derived from org-level + role,
     * but this can be expanded if we have explicit property-user assignments.
     */
    protected function checkPropertyScope(User $user, Model $model): bool
    {
        // For now, Managers and Staff operate within their Org, so checking Org scope is the baseline.
        // If we implement specific property assignment to users later, this logic will change.
        return $user->org_id === $model->org_id;
    }
}
