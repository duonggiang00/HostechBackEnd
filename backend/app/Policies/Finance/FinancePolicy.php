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
     * - Owner/Manager: Toàn quyền (tạo, xem, hủy, xem sổ cái)
     * - Staff: Chỉ xem
     * - Tenant: Chỉ xem payments của mình
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner'   => 'CRUD',
            'Manager' => 'CRUD',
            'Staff'   => 'R',
            'Tenant'  => 'R',
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
        return $user->hasPermissionTo('create Payment');
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
