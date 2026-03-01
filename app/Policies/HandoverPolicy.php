<?php

namespace App\Policies;

use App\Contracts\RbacModuleProvider;
use App\Models\Handover\Handover;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class HandoverPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    /**
     * Tên Module dùng làm tiền tố (prefix) cho các quyền.
     */
    public static function getModuleName(): string
    {
        return 'Handover';
    }

    /**
     * Định nghĩa các quyền cơ bản (CRUD) áp dụng cho từng Role khi chạy rbac:sync.
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'CRUD',
            'Tenant' => 'R', // Tenant chỉ có quyền xem biên bản của hợp đồng mình
        ];
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Handover');
    }

    public function view(User $user, Handover $handover): bool
    {
        if (! $user->hasPermissionTo('view Handover')) {
            return false;
        }

        if ($user->hasRole('Tenant') || $user->hasRole('tenant')) {
            return $handover->status === 'CONFIRMED' && $user->contracts()->where('id', $handover->contract_id)->exists();
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Handover');
    }

    public function update(User $user, Handover $handover): bool
    {
        if ($handover->status === 'CONFIRMED') {
            return false;
        }

        if (! $user->hasPermissionTo('update Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function delete(User $user, Handover $handover): bool
    {
        if ($handover->status === 'CONFIRMED') {
            return false;
        }

        if (! $user->hasPermissionTo('delete Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function restore(User $user, Handover $handover): bool
    {
        if (! $user->hasPermissionTo('delete Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function forceDelete(User $user, Handover $handover): bool
    {
        if (! $user->hasPermissionTo('delete Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }
}
