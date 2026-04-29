<?php

namespace App\Policies\Finance;

use App\Contracts\RbacModuleProvider;
use App\Models\Finance\Payment;
use App\Models\Org\User;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class FinancePolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesPropertyScope;

    // ╔═══════════════════════════════════════════════════════╗
    // ║  RBAC MODULE REGISTRATION                            ║
    // ╠═══════════════════════════════════════════════════════╣

    public static function getModuleName(): string
    {
        return 'Payment';
    }

    /**
     * Ma trận quyền:
     * - Owner/Manager: Toàn quyền (tạo, xem, sửa, hủy, xem sổ cái)
     * - Staff: Xem + update (policy siết: chỉ duyệt/từ chối chứng từ tenant PENDING)
     * - Tenant: Chỉ xem payments của mình
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'RU',
            'Tenant' => 'R',
        ];
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  POLICY METHODS                                       ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xem danh sách payments?
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Payment');
    }

    /**
     * Xem chi tiết 1 payment?
     * Tenant chỉ xem payment của mình (payer_user_id).
     */
    public function view(User $user, Payment $payment): bool
    {
        if ($user->hasRole('Tenant')) {
            return (string) $payment->payer_user_id === (string) $user->id;
        }

        if (! $user->hasPermissionTo('view Payment')) {
            return false;
        }

        return $this->checkPropertyScope($user, $payment);
    }

    /**
     * Tạo payment?
     */
    public function create(User $user): bool
    {
        if ($user->hasRole('Tenant')) {
            return true;
        }

        return $user->hasPermissionTo('create Payment');
    }

    /**
     * Cập nhật payment (duyệt / từ chối chứng từ tenant, v.v.).
     *
     * Staff chỉ được update khi giao dịch là PENDING do tenant gửi (meta.submitted_by_tenant),
     * trong phạm vi property được giao. Owner/Manager: mọi payment trong scope nếu có quyền update.
     */
    public function update(User $user, Payment $payment): bool
    {
        if ($user->hasRole('Tenant')) {
            return false;
        }

        if (! $user->hasPermissionTo('update Payment')) {
            return false;
        }

        if (! $this->checkPropertyScope($user, $payment)) {
            return false;
        }

        if ($user->hasRole('Staff')) {
            return $payment->status === 'PENDING'
                && filter_var($payment->meta['submitted_by_tenant'] ?? false, FILTER_VALIDATE_BOOLEAN);
        }

        return true;
    }

    /**
     * Hủy (void) payment?
     */
    public function delete(User $user, Payment $payment): bool
    {
        if (! $user->hasPermissionTo('delete Payment')) {
            return false;
        }

        return $this->checkPropertyScope($user, $payment);
    }

    /**
     * Xem sổ cái (Ledger)?
     */
    public function viewLedger(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Payment');
    }
}
