<?php

namespace App\Features\Handover\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Handover\Models\Handover;
use App\Features\Org\Models\User;
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
            'Staff' => 'CRUD', // Staff thường cũng được tạo/sửa biên bản
            'Tenant' => '-',   // Tenant không có quyền qua RBAC tiêu chuẩn, sẽ được check riêng trong logic policy
        ];
    }

    public function viewAny(User $user): bool
    {
        return $user->can('viewAny Handover');
    }

    public function view(User $user, Handover $handover): bool
    {
        if ($user->can('view Handover')) {
            return $this->checkOrgScope($user, $handover);
        }

        if ($user->hasAnyRole(['tenant', 'Tenant'])) {
            // Chỉ thấy biên bản đã Confirm gắn với hợp đồng thuê của họ
            return $handover->status === 'CONFIRMED' && \App\Features\Contract\Models\ContractMember::where('user_id', $user->id)->where('contract_id', $handover->contract_id)->exists();
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->can('create Handover');
    }

    public function update(User $user, Handover $handover): bool
    {
        if ($handover->status === 'CONFIRMED') {
            return false;
        }

        if (! $user->can('update Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function delete(User $user, Handover $handover): bool
    {
        if ($handover->status === 'CONFIRMED') {
            return false;
        }

        if (! $user->can('delete Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function restore(User $user, Handover $handover): bool
    {
        if (! $user->can('delete Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }

    public function forceDelete(User $user, Handover $handover): bool
    {
        if (! $user->can('delete Handover')) {
            return false;
        }

        return $this->checkOrgScope($user, $handover);
    }
}
