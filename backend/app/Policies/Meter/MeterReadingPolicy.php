<?php

namespace App\Policies\Meter;

use App\Contracts\RbacModuleProvider;
use App\Models\Meter\MeterReading;
use App\Models\Org\User;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class MeterReadingPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    /**
     * Tên Module dùng làm tiền tố (prefix) cho các quyền.
     */
    public static function getModuleName(): string
    {
        return 'MeterReading';
    }

    /**
     * Định nghĩa các quyền cơ bản (CRUD) áp dụng cho từng Role khi chạy rbac:sync.
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'CR',   // R/C: Xem danh sách, tạo chỉ số chốt
            'Tenant' => 'CR',  // C: Gửi chỉ số, R: Xem lịch sử chỉ số của phòng mình
        ];
    }

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny MeterReading');
    }

    public function view(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('view MeterReading')) {
            return false;
        }

        return $this->checkOrgScope($user, $meterReading);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create MeterReading');
    }

    public function update(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('update MeterReading')) {
            return false;
        }

        return $this->checkOrgScope($user, $meterReading);
    }

    public function delete(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        return $this->checkOrgScope($user, $meterReading);
    }

    public function restore(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        return $this->checkOrgScope($user, $meterReading);
    }

    public function forceDelete(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        return $this->checkOrgScope($user, $meterReading);
    }
}
