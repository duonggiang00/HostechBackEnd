<?php

namespace App\Features\Meter\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Meter\Models\Meter;
use App\Features\Org\Models\User;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class MeterPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesPropertyScope;

    /**
     * Tên Module dùng làm tiền tố (prefix) cho các quyền.
     */
    public static function getModuleName(): string
    {
        return 'Meter';
    }

    /**
     * Ma trận quyền mặc định cho từng Role khi chạy rbac:sync
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',   // Xem, Thêm, Sửa, Xóa
            'Manager' => 'CRUD',
            'Staff' => 'R',      // Chỉ xem
            'Tenant' => '-',    // Không có quyền
        ];
    }

    /**
     * Xem danh sách?
     */
    public function viewAny(User $user): bool
    {
        return $user->can('viewAny Meter');
    }

    /**
     * Xem chi tiết?
     */
    public function view(User $user, Meter $meter): bool
    {
        if (! $user->can('view Meter')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meter);
    }

    /**
     * Tạo mới?
     */
    public function create(User $user): bool
    {
        return $user->can('create Meter');
    }

    /**
     * Cập nhật?
     */
    public function update(User $user, Meter $meter): bool
    {
        if (! $user->can('update Meter')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meter);
    }

    /**
     * Xóa?
     */
    public function delete(User $user, Meter $meter): bool
    {
        if (! $user->can('delete Meter')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meter);
    }

    /**
     * Khôi phục?
     */
    public function restore(User $user, Meter $meter): bool
    {
        if (! $user->can('delete Meter')) { // Dùng chung quyền xóa cho restore
            return false;
        }

        return $this->checkPropertyScope($user, $meter);
    }

    /**
     * Xóa vĩnh viễn?
     */
    public function forceDelete(User $user, Meter $meter): bool
    {
        if (! $user->can('delete Meter')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meter);
    }
}
