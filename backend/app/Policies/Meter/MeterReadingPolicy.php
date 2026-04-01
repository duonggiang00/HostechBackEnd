<?php

namespace App\Policies\Meter;

use App\Contracts\RbacModuleProvider;
use App\Models\Meter\MeterReading;
use App\Models\Org\User;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class MeterReadingPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesPropertyScope;

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

        return $this->checkPropertyScope($user, $meterReading);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create MeterReading');
    }

    public function update(User $user, MeterReading $meterReading): bool
    {
        // Manager/Owner keep full update permission in property scope.
        if ($user->hasPermissionTo('update MeterReading')) {
            return $this->checkPropertyScope($user, $meterReading);
        }

        // Staff can revise their own DRAFT records before submission.
        if (
            $user->hasRole('Staff')
            && $user->hasPermissionTo('create MeterReading')
            && $meterReading->status === 'DRAFT'
            && $meterReading->submitted_by_user_id === $user->id
        ) {
            return $this->checkPropertyScope($user, $meterReading);
        }

        return false;
    }

    public function delete(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    public function restore(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    public function forceDelete(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasPermissionTo('delete MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Only Managers can approve or reject meter readings.
     */
    public function approve(User $user, MeterReading $meterReading): bool
    {
        // Only Manager and Owner can approve (has 'U' permission which includes approve operations)
        if (! $user->hasPermissionTo('update MeterReading')) {
            return false;
        }

        // Additional check: Only Manager role (not Staff) can approve
        if (! $user->hasRole(['Manager', 'Owner'])) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }
}
