<?php

namespace App\Policies\Meter;

use App\Contracts\RbacModuleProvider;
use App\Models\Meter\Meter;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class MeterPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    /**
     * Tên Module dùng làm tiền tố (prefix) cho các quyền.
     */
    public static function getModuleName(): string
    {
        return 'Meter';
    }

    /**
     * Định nghĩa các quyền cơ bản (CRUD) áp dụng cho từng Role khi chạy rbac:sync.
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD', // Xem, Thêm, Sửa, Xóa
            'Manager' => 'CRUD',
            'Staff' => 'R',    // Chỉ Xem
            'Tenant' => '-',    // Không có quyền
        ];
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Meter');
    }

    public function view(User $user, Meter $meter): bool
    {
        if (! $user->hasPermissionTo('view Meter')) {
            return false;
        }

        // Kiểm tra quyền sở hữu tầng vật lý
        return $this->checkOrgScope($user, $meter);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Meter');
    }

    public function update(User $user, Meter $meter): bool
    {
        if (! $user->hasPermissionTo('update Meter')) {
            return false;
        }

        return $this->checkOrgScope($user, $meter);
    }

    public function delete(User $user, Meter $meter): bool
    {
        if (! $user->hasPermissionTo('delete Meter')) {
            return false;
        }

        return $this->checkOrgScope($user, $meter);
    }

    public function restore(User $user, Meter $meter): bool
    {
        if (! $user->hasPermissionTo('delete Meter')) { // Dùng chung quyền delete cho restore
            return false;
        }

        return $this->checkOrgScope($user, $meter);
    }

    public function forceDelete(User $user, Meter $meter): bool
    {
        if (! $user->hasPermissionTo('delete Meter')) {
            return false;
        }

        return $this->checkOrgScope($user, $meter);
    }
}
