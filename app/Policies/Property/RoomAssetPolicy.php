<?php

namespace App\Policies\Property;

use App\Contracts\RbacModuleProvider;
use App\Models\Org\User;
use App\Models\Property\Room;
use App\Models\Property\RoomAsset;
use App\Traits\HandlesOrgScope;
use Illuminate\Auth\Access\HandlesAuthorization;

class RoomAssetPolicy implements RbacModuleProvider
{
    use HandlesAuthorization, HandlesOrgScope;

    /**
     * Get the module name for RBAC
     */
    public static function getModuleName(): string
    {
        return 'RoomAsset';
    }

    /**
     * Get default roles and their permissions for this module
     */
    public static function getRolePermissions(): array
    {
        return [
            'Owner' => 'CRUD',
            'Manager' => 'CRUD',
            'Staff' => 'V',
            'Tenant' => 'V',
        ];
    }

    private function checkAccess(User $user, RoomAsset $asset = null, Room $room = null): bool
    {
        // Require at least one model context
        if (!$asset && !$room) {
            return false;
        }

        $targetRoom = $asset ? $asset->room : $room;
        if (!$targetRoom) {
            return false;
        }

        // 1. Admin được quyền tạo/quản lý tùy thích
        if ($user->hasRole('Admin')) {
            return true;
        }

        // Phải cùng tổ chức (Org scope restriction)
        if ((string)$user->org_id !== (string)$targetRoom->org_id) {
            return false;
        }

        // 2. Owner chỉ tạo room asset theo org
        if ($user->hasRole('Owner')) {
            return true;
        }

        // 3. Manager, Staff chỉ tạo/vận hành theo properties
        if ($user->hasRole('Manager') || $user->hasRole('Staff')) {
            $managedProperties = $user->meta['property_ids'] ?? [];
            return in_array((string)$targetRoom->property_id, $managedProperties);
        }

        // 4. Tenant chỉ xem room asset theo room thông qua contract hiện tại
        if ($user->hasRole('Tenant')) {
            return \App\Models\Contract\ContractMember::where('user_id', $user->id)
                ->whereHas('contract', function($q) use ($targetRoom) {
                    $q->where('room_id', $targetRoom->id)->where('status', 'ACTIVE');
                })->exists();
        }

        return false;
    }

    public function viewAny(User $user, Room $room = null): bool
    {
        if (!$user->hasPermissionTo('viewAny RoomAsset')) {
            return false;
        }

        if (!$room) {
            return $user->hasRole('Admin') || $user->hasRole('Owner');
        }

        return $this->checkAccess($user, null, $room);
    }

    public function view(User $user, RoomAsset $asset): bool
    {
        return $user->hasPermissionTo('view RoomAsset') && $this->checkAccess($user, $asset);
    }

    public function create(User $user, Room $room = null): bool
    {
        if (!$user->hasPermissionTo('create RoomAsset')) {
            return false;
        }

        if (!$room) {
            return $user->hasRole('Admin') || $user->hasRole('Owner');
        }

        return $this->checkAccess($user, null, $room);
    }

    public function update(User $user, RoomAsset $asset): bool
    {
        return $user->hasPermissionTo('update RoomAsset') && $this->checkAccess($user, $asset);
    }

    public function delete(User $user, RoomAsset $asset): bool
    {
        return $user->hasPermissionTo('delete RoomAsset') && $this->checkAccess($user, $asset);
    }
}
