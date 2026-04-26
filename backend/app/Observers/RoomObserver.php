<?php

namespace App\Observers;

use App\Models\Meter\Meter;
use App\Models\Property\Room;
use App\Models\Property\RoomFloorPlanNode;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class RoomObserver
{
    // Logic migrated to InitializeRoomServices (Queued) and ClearBuildingOverviewCache (Queued)

    /**
     * Khi phòng bị xóa (soft-delete):
     *
     * XÓA:
     *  - FloorPlanNode   — vị trí Grid phải được dọn ngay
     *  - Media (gallery) — ảnh phòng không còn ý nghĩa khi phòng bị xóa
     *  - RoomAsset       — tài sản gắn với phòng
     *  - Meter           — đồng hồ điện/nước
     *
     * GIỮ LẠI (không xóa):
     *  - Contracts  — hợp đồng là hồ sơ pháp lý, cần lưu trữ lịch sử
     *  - Invoices   — hóa đơn tài chính, cần lưu trữ
     */
    public function deleting(Room $room): void
    {
        // 1. FloorPlanNode
        RoomFloorPlanNode::where('room_id', $room->id)->delete();

        // 2. Media (gallery, cover, etc.) — dùng Spatie Media Library
        $room->clearMediaCollection();

        // 3. RoomAssets
        $room->assets()->delete();

        // 4. Meters (đồng hồ điện/nước)
        // Dùng Meter model để trigger bất kỳ Observer nào của Meter nếu có
        Meter::where('room_id', $room->id)->delete();
    }

    // Private helpers removed as they are now handled by Listeners
}
