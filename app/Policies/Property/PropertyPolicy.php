<?php

namespace App\Policies\Property;

use App\Contracts\RbacModuleProvider;
use App\Models\Property\Property;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\Response;

class PropertyPolicy implements RbacModuleProvider
{
    use HandlesOrgScope;

    public static function getModuleName(): string
    {
        return 'Properties'; // Matches the module name in existing Seeder/Policies context
    }

    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'RU',
            'Staff' => 'R',
            'Tenant' => 'R', // Granted but Scoped via Service/Policy contract check
        ];
    }

    public function viewAny(User $user): bool
    {
        if ($user->hasPermissionTo('viewAny Properties')) {
            return true;
        }
        return false;
    }

    public function view(User $user, Property $property): bool
    {
        if (! $user->hasPermissionTo('view Properties')) {
            return false;
        }

        if ($user->hasRole('Tenant')) {
            // Tenant chỉ được xem chi tiết Tòa nhà nếu đang có Contract ACTIVE tại đó
            return \App\Models\Contract\Contract::where('property_id', $property->id)
                ->where('status', 'ACTIVE')
                ->whereHas('members', function ($q) use ($user) {
                    $q->where('user_id', $user->id)->where('status', 'APPROVED');
                })
                ->exists();
        }

        return $this->checkOrgScope($user, $property);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Properties');
    }

    public function update(User $user, Property $property): bool
    {
        if (! $user->hasPermissionTo('update Properties')) {
            return false;
        }

        return $this->checkOrgScope($user, $property);
    }

    public function delete(User $user, Property $property): bool
    {
        if (! $user->hasPermissionTo('delete Properties')) {
            return false;
        }

        return $this->checkOrgScope($user, $property);
    }
}
