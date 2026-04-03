<?php

namespace App\Features\Meter\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Meter\Models\MeterReading;
use App\Features\Org\Models\User;
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
     * Ma trận quyền mặc định cho từng Role khi chạy rbac:sync
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',   // Full quyền
            'Manager' => 'CRUD',   // Full quyền
            'Staff' => 'R',      // Chỉ xem chỉ số
            'Tenant' => 'CR',    // C: Gửi chỉ số, R: Xem lịch sử chỉ số của phòng mình
        ];
    }

    /**
     * Xem danh sách?
     */
    public function viewAny(User $user): bool
    {
        return $user->can('viewAny MeterReading');
    }

    /**
     * Xem chi tiết?
     */
    public function view(User $user, MeterReading $meterReading): bool
    {
        if ($user->hasRole('Tenant')) {
            // Tenant chỉ thấy chỉ số của meter thuộc room của họ
            return $meterReading->meter
                && $meterReading->meter->room
                && $meterReading->meter->room->contracts()->whereHas('members', function($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->exists();
        }

        if (! $user->can('view MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Tạo mới?
     */
    public function create(User $user): bool
    {
        return $user->can('create MeterReading');
    }

    /**
     * Cập nhật?
     */
    public function update(User $user, MeterReading $meterReading): bool
    {
        // Staff/Manager/Owner can update ANY if they have the permission and pass property scope
        if ($user->can('update MeterReading')) {
            return $this->checkPropertyScope($user, $meterReading);
        }

        return false;
    }

    /**
     * Xóa?
     */
    public function delete(User $user, MeterReading $meterReading): bool
    {
        if (! $user->can('delete MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }

    /**
     * Phê duyệt chỉ số?
     * Chỉ dành cho Manager/Owner.
     */
    public function approve(User $user, MeterReading $meterReading): bool
    {
        if (! $user->hasRole(['Manager', 'Owner'])) {
            return false;
        }

        if (! $user->can('update MeterReading')) {
            return false;
        }

        return $this->checkPropertyScope($user, $meterReading);
    }
}
