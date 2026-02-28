<?php

namespace App\Policies\Ticket;

use App\Contracts\RbacModuleProvider;
use App\Models\Org\User;
use App\Models\Ticket\Ticket;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class TicketPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    // ╔═══════════════════════════════════════════════════════╗
    // ║  RBAC MODULE REGISTRATION                            ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tên module → sinh permissions: viewAny Ticket, view Ticket, create Ticket, ...
     */
    public static function getModuleName(): string
    {
        return 'Ticket';
    }

    /**
     * Ma trận quyền theo role.
     *
     * Owner/Manager  : CRUD đầy đủ
     * Staff          : Xem + cập nhật trạng thái (RU)
     * Tenant         : Tạo + Xem phiếu của mình (CR)
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'RU',
            'Tenant' => 'CR',
        ];
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  POLICY METHODS                                       ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xem danh sách tickets?
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('viewAny Ticket');
    }

    /**
     * Xem chi tiết 1 ticket?
     *
     * Tenant chỉ thấy ticket do chính họ tạo hoặc gắn với phòng của họ.
     */
    public function view(User $user, Ticket $ticket): bool
    {
        if ($user->hasRole('Tenant')) {
            // Tenant chỉ xem ticket do mình tạo
            return (string) $ticket->created_by_user_id === (string) $user->id;
        }

        if (! $user->hasPermissionTo('view Ticket')) {
            return false;
        }

        return $this->checkOrgScope($user, $ticket);
    }

    /**
     * Tạo ticket mới?
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create Ticket');
    }

    /**
     * Cập nhật thông tin ticket? (priority, category, assigned_to...)
     */
    public function update(User $user, Ticket $ticket): bool
    {
        if (! $user->hasPermissionTo('update Ticket')) {
            return false;
        }

        return $this->checkOrgScope($user, $ticket);
    }

    /**
     * Xóa ticket?
     */
    public function delete(User $user, Ticket $ticket): bool
    {
        if (! $user->hasPermissionTo('delete Ticket')) {
            return false;
        }

        return $this->checkOrgScope($user, $ticket);
    }

    /**
     * Chuyển trạng thái ticket? (Owner, Manager, Staff được đổi status)
     */
    public function updateStatus(User $user, Ticket $ticket): bool
    {
        if (! $user->hasPermissionTo('update Ticket')) {
            return false;
        }

        return $this->checkOrgScope($user, $ticket);
    }

    /**
     * Thêm bình luận / event vào ticket?
     */
    public function addEvent(User $user, Ticket $ticket): bool
    {
        if ($user->hasRole('Tenant')) {
            return (string) $ticket->created_by_user_id === (string) $user->id;
        }

        if (! $user->hasPermissionTo('view Ticket')) {
            return false;
        }

        return $this->checkOrgScope($user, $ticket);
    }

    /**
     * Thêm chi phí vào ticket? (Owner, Manager)
     */
    public function addCost(User $user, Ticket $ticket): bool
    {
        if (! $user->hasPermissionTo('update Ticket')) {
            return false;
        }

        return $this->checkOrgScope($user, $ticket);
    }
}
