<?php

namespace App\Features\Invoice\Policies;

use App\Contracts\RbacModuleProvider;
use App\Features\Invoice\Models\Invoice;
use App\Features\Org\Models\User;
use App\Traits\HandlesPropertyScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class InvoicePolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesPropertyScope;

    // ╔═══════════════════════════════════════════════════════╗
    // ║  RBAC MODULE REGISTRATION                            ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tên module → sẽ sinh permissions: viewAny Invoice, view Invoice, create Invoice, ...
     */
    public static function getModuleName(): string
    {
        return 'Invoice';
    }

    /**
     * Ma trận quyền theo role.
     *
     * 'CRUD' = Create + Read (viewAny, view) + Update + Delete
     * 'R'    = Read only (viewAny, view)
     * 'RU'   = Read + Update
     *
     * Shorthand mapping (xem app/Enums/RbacAction.php):
     *   C → create
     *   R → viewAny + view
     *   U → update
     *   D → delete
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',   // Full quyền
            'Manager' => 'CRUD',   // Full quyền
            'Staff' => 'R',      // Chỉ xem danh sách + chi tiết
            'Tenant' => 'R',      // Chỉ xem (logic riêng: chỉ thấy hóa đơn của mình)
        ];
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  POLICY METHODS (Kiểm tra quyền runtime)             ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xem DANH SÁCH hóa đơn?
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Invoice');
    }

    /**
     * Xem CHI TIẾT 1 hóa đơn?
     *
     * Tenant: chỉ xem hóa đơn thuộc hợp đồng của mình.
     * Các role khác: check permission + property scope.
     */
    public function view(User $user, Invoice $invoice): bool
    {
        // Tenant → chỉ xem hóa đơn gắn với contract mà họ là thành viên
        if ($user->hasRole('Tenant')) {
            return $invoice->contract
                && $invoice->contract->members()
                    ->where('user_id', $user->id)
                    ->exists();
        }

        if (! $user->hasPermissionTo('view Invoice')) {
            return false;
        }

        return $this->checkPropertyScope($user, $invoice);
    }

    /**
     * TẠO hóa đơn?
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Invoice');
    }

    /**
     * CẬP NHẬT hóa đơn?
     */
    public function update(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('update Invoice')) {
            return false;
        }

        return $this->checkPropertyScope($user, $invoice);
    }

    /**
     * XÓA MỀM hóa đơn?
     * Lưu ý nghiệp vụ: chỉ xóa được khi status = DRAFT
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('delete Invoice')) {
            return false;
        }

        return $this->checkPropertyScope($user, $invoice);
    }

    /**
     * KHÔI PHỤC hóa đơn đã xóa mềm?
     */
    public function restore(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('delete Invoice')) {
            return false;
        }

        return $this->checkPropertyScope($user, $invoice);
    }

    /**
     * XÓA VĨNH VIỄN?
     */
    public function forceDelete(User $user, Invoice $invoice): bool
    {
        if (! $user->hasPermissionTo('delete Invoice')) {
            return false;
        }

        return $this->checkPropertyScope($user, $invoice);
    }
}
