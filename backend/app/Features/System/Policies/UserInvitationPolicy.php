<?php

namespace App\Features\System\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Org\Models\User;
use App\Features\System\Models\UserInvitation;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserInvitationPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'UserInvitations';
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CR',
            'Staff' => '-',
            'Tenant' => '-',
        ];
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny UserInvitations');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, UserInvitation $invitation): bool
    {
        if (! $user->hasPermissionTo('view UserInvitations')) {
            return false;
        }

        return $this->checkOrgScope($user, $invitation);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create UserInvitations');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, UserInvitation $invitation): bool
    {
        if (! $user->hasPermissionTo('delete UserInvitations')) {
            return false;
        }

        return $this->checkOrgScope($user, $invitation);
    }
}
