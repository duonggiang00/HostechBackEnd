<?php

namespace App\Observers;

use App\Models\Meter\Meter;
use App\Models\Property\Room;
use App\Models\Property\RoomFloorPlanNode;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class RoomObserver
{
    /**
     * Khi phòng được tạo:
     * 1. Tự động tạo FloorPlanNode (vị trí Grid) — chỉ khi chưa có
     * 2. Tạo 2 Meter mặc định (Điện + Nước) — CHỈ KHI không dùng Template
     */
    public function created(Room $room): void
    {
        $this->createDefaultFloorPlanNode($room);
        $this->createDefaultMeters($room);
    }

    /**
     * Clear Building Overview Cache on any change.
     */
    public function saved(Room $room): void
    {
        $this->invalidateCache($room);
    }

    public function deleted(Room $room): void
    {
        $this->invalidateCache($room);
    }

    public function restored(Room $room): void
    {
        $this->invalidateCache($room);
    }

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

    // ─── Private Helpers ─────────────────────────────────────────────────

    /**
     * Tạo FloorPlanNode với vị trí Grid tự động.
     * x = column_index (max hiện tại + 1), y = 0
     * Guard: bỏ qua nếu Node đã tồn tại (tránh duplicate khi sync batch override)
     */
    private function createDefaultFloorPlanNode(Room $room): void
    {
        // Guard: nếu Node đã tồn tại (vd. syncLayout vừa tạo) thì bỏ qua
        if (RoomFloorPlanNode::where('room_id', $room->id)->exists()) {
            return;
        }

        // Không tạo node nếu floor_id chưa được gán
        if (! $room->floor_id) {
            return;
        }

        // Tìm cột lớn nhất hiện tại trong tầng này
        $maxColumn = RoomFloorPlanNode::where('floor_id', $room->floor_id)->max('x');
        $nextColumn = $maxColumn !== null ? (int) ceil((float) $maxColumn) + 1 : 0;

        RoomFloorPlanNode::create([
            // HasUuids sẽ tự sinh ID — không cần truyền 'id'
            'org_id'   => $room->org_id,
            'floor_id' => $room->floor_id,
            'room_id'  => $room->id,
            'x'        => $nextColumn, // column_index
            'y'        => 0,           // row_index
            'width'    => 1,           // col_span
            'height'   => 1,           // row_span
        ]);
    }

    /**
     * Tạo 2 Meter mặc định: Điện (ELECTRIC) và Nước (WATER)
     */
    private function createDefaultMeters(Room $room): void
    {
        // Guard: bỏ qua nếu đã có meter (tránh tạo duplicate)
        if (Meter::where('room_id', $room->id)->exists()) {
            return;
        }

        $types = [
            'ELECTRIC' => 'E',
            'WATER'    => 'W',
        ];

        foreach ($types as $type => $suffix) {
            $propertySuffix = $room->property_id ? '-' . substr($room->property_id, 0, 4) : '';
            Meter::create([
                // HasUuids sẽ tự sinh ID
                'org_id'       => $room->org_id,
                'room_id'      => $room->id,
                'property_id'  => $room->property_id,
                'type'         => $type,
                'code'         => "{$room->code}-{$suffix}{$propertySuffix}",
                'is_active'    => true,
                'base_reading' => 0,
            ]);
        }
    }

    /**
     * Xóa cache building overview của tòa nhà chứa phòng này.
     */
    private function invalidateCache(Room $room): void
    {
        if ($room->property_id) {
            Cache::forget("building_overview_{$room->property_id}");
        }
    }
}
