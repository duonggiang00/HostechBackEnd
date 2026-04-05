<?php

namespace App\Services\Property;

use App\Events\Property\BuildingOverviewUpdated;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomFloorPlanNode;
use App\Models\Property\RoomTemplate;
use App\Models\Org\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BuildingOverviewService
{
    public function __construct(
        protected RoomService $roomService,
    ) {}

    /**
     * Lấy toàn bộ cấu trúc tòa nhà cho Grid view.
     * Cache 5 phút để giảm tải DB.
     */
    public function getLayout(Property $property): array
    {
        return Cache::remember(
            "building_overview_{$property->id}",
            300, // 5 phút
            fn () => $this->buildLayoutData($property)
        );
    }

    /**
     * Batch sync layout: tạo tầng mới, tạo phòng mới, cập nhật vị trí, xóa đối tượng.
     * Toàn bộ trong 1 transaction để đảm bảo tính toàn vẹn.
     */
    public function syncLayout(Property $property, array $payload, User $user): array
    {
        // 0. Pre-flight validation
        $this->validateSync($property, $payload);

        return DB::transaction(function () use ($property, $payload, $user) {
            $summary = [
                'floors_added'   => 0,
                'rooms_added'    => 0,
                'rooms_moved'    => 0,
                'rooms_deleted'  => 0,
                'floors_deleted' => 0,
            ];

            // 1. Xóa tầng bị xóa trước (cascade xóa phòng bên trong qua Observer)
            if (! empty($payload['deleted_floor_ids'])) {
                foreach ($payload['deleted_floor_ids'] as $floorId) {
                    $floor = Floor::find($floorId);
                    if ($floor && (string) $floor->property_id === (string) $property->id) {
                        // Xóa tất cả phòng trong tầng (Observer sẽ dọn FloorPlanNode)
                        Room::where('floor_id', $floorId)->get()->each(fn (Room $r) => $r->delete());
                        $floor->delete();
                        $summary['floors_deleted']++;
                    }
                }
            }

            // 2. Xóa phòng bị xóa riêng lẻ
            if (! empty($payload['deleted_room_ids'])) {
                foreach ($payload['deleted_room_ids'] as $roomId) {
                    $room = Room::find($roomId);
                    if ($room && (string) $room->property_id === (string) $property->id) {
                        $room->delete(); // Observer sẽ tự xóa FloorPlanNode
                        $summary['rooms_deleted']++;
                    }
                }
            }

            // Map temp_id => real_id để resolve references
            $floorIdMap = []; // temp_id => real floor_id

            // 3. Xử lý từng tầng trong sync_data
            foreach ($payload['sync_data'] as $floorData) {
                $floorId = $this->resolveFloorId($floorData, $property, $floorIdMap, $summary);

                if (! $floorId) {
                    continue;
                }

                // 4. Xử lý các phòng trong tầng
                foreach ($floorData['rooms'] as $roomData) {
                    $roomId = $this->resolveRoomId($roomData, $property, $floorId, $payload['template_id'] ?? null, $user, $summary);

                    if (! $roomId) {
                        continue;
                    }

                    // 5. Override vị trí Grid (x, y, width, height)
                    $room = Room::find($roomId);
                    if ($room) {
                        RoomFloorPlanNode::updateOrCreate(
                            ['room_id' => $roomId],                 // search key
                            [
                                'org_id'   => $property->org_id,   // update values only
                                'floor_id' => $floorId,
                                'x'        => (int) $roomData['x'],
                                'y'        => (int) ($roomData['y'] ?? 0),
                                'width'    => (int) ($roomData['width'] ?? 1),
                                'height'   => (int) ($roomData['height'] ?? 1),
                            ]
                        );
                        $summary['rooms_moved']++;
                    }
                }
            }

            // 6. Phát event để clear cache và trigger các side-effects
            BuildingOverviewUpdated::dispatch($property->id, $user->id, $summary);

            return $this->buildLayoutData($property);
        });
    }

    // ─── Private Helpers ─────────────────────────────────────────────────

    /**
     * Trả về floor_id thực (tạo mới nếu là temp entry).
     */
    private function resolveFloorId(array $floorData, Property $property, array &$floorIdMap, array &$summary): ?string
    {
        // Tầng CŨ — đã có ID thực
        if (! empty($floorData['floor_id'])) {
            return $floorData['floor_id'];
        }

        // Tầng MỚI — có temp_id
        if (! empty($floorData['temp_id'])) {
            $floorNumber = $floorData['floor_number'] ?? ($property->floors()->max('floor_number') + 1);
            $floorName   = $floorData['name'] ?? "Tầng {$floorNumber}";

            $floor = Floor::create([
                'org_id'       => $property->org_id,
                'property_id'  => $property->id,
                'name'         => $floorName,
                'floor_number' => $floorNumber,
            ]);
            $floorIdMap[$floorData['temp_id']] = $floor->id;
            $summary['floors_added']++;

            return $floor->id;
        }

        return null;
    }

    /**
     * Trả về room_id thực (tạo mới nếu là temp entry).
     */
    private function resolveRoomId(
        array $roomData,
        Property $property,
        string $floorId,
        ?string $globalTemplateId,
        User $user,
        array &$summary
    ): ?string {
        // Phòng CŨ — đã có ID thực, chỉ cập nhật vị trí
        if (! empty($roomData['id'])) {
            return $roomData['id'];
        }

        // Phòng MỚI — có temp_id
        if (! empty($roomData['temp_id'])) {
            $templateId = $roomData['template_id'] ?? $globalTemplateId;

            if ($templateId) {
                // Tạo từ Template — Observer sẽ tạo FloorPlanNode, Template tạo Meters
                $room = $this->roomService->createFromTemplate($templateId, [
                    'property_id' => $property->id,
                    'floor_id'    => $floorId,
                    'code'        => $roomData['code'] ?? null,
                    'status'      => 'available',
                ], $user);
            } else {
                // Tạo nhanh không dùng template — Observer tạo FloorPlanNode + 2 Meters mặc định
                $room = $this->roomService->quickCreate([
                    'property_id' => $property->id,
                    'floor_id'    => $floorId,
                    'name'        => $roomData['code'] ?? 'Phòng mới',
                ], $user);
            }

            $summary['rooms_added']++;

            return $room->id;
        }

        return null;
    }

    /**
     * Rà soát toàn bộ yêu cầu trước khi lưu.
     */
    private function validateSync(Property $property, array $payload): void
    {
        // 1. Chặn xóa tầng có phòng
        if (! empty($payload['deleted_floor_ids'])) {
            $floorsWithRooms = Floor::whereIn('id', $payload['deleted_floor_ids'])
                ->whereHas('rooms')
                ->pluck('name')
                ->toArray();

            if (! empty($floorsWithRooms)) {
                throw new \Exception("Không thể xóa tầng đang có chứa phòng: " . implode(', ', $floorsWithRooms) . ". Vui lòng chuyển hoặc xóa phòng trước.");
            }
        }

        // 2. Chặn xóa phòng đang có người ở
        if (! empty($payload['deleted_room_ids'])) {
            $occupiedRooms = Room::whereIn('id', $payload['deleted_room_ids'])
                ->where('status', 'occupied')
                ->pluck('code')
                ->toArray();

            if (! empty($occupiedRooms)) {
                throw new \Exception("Không thể xóa các phòng đang có người ở: " . implode(', ', $occupiedRooms));
            }
        }

        // 3. Chặn đè phòng (Overlap) & Kiểm tra Diện tích (Area Capacity) per floor
        $roomTemplates = RoomTemplate::where('property_id', $property->id)->get()->keyBy('id');

        foreach ($payload['sync_data'] as $floorData) {
            $floorId = $floorData['floor_id'] ?? null;
            $floor = $floorId ? Floor::find($floorId) : null;
            
            $effectiveFloorArea = $floor ? ($floor->area - $floor->shared_area) : ($property->area - $property->shared_area);
            $totalRoomArea = 0;
            $rects = [];

            foreach ($floorData['rooms'] ?? [] as $roomData) {
                $x1 = (int) ($roomData['x'] ?? 0);
                $y1 = (int) ($roomData['y'] ?? 0);
                $x2 = $x1 + (int) ($roomData['width'] ?? 1);
                $y2 = $y1 + (int) ($roomData['height'] ?? 1);

                // Overlap Check
                foreach ($rects as $r) {
                    if (! ($x2 <= $r['x1'] || $x1 >= $r['x2'] || $y2 <= $r['y1'] || $y1 >= $r['y2'])) {
                        $code = $roomData['code'] ?? null;
                        if (! $code && ! empty($roomData['id'])) {
                            $room = Room::find($roomData['id']);
                            $code = $room ? $room->code : $roomData['id'];
                        }
                        $roomIdStr = $code ?? 'Không xác định';

                        throw new \Exception("Lỗi sơ đồ: Phòng {$roomIdStr} đang nằm đè lên một phòng khác tại cùng một tầng. Vui lòng kiểm tra lại vị trí các ô trên lưới.");
                    }
                }
                $rects[] = ['x1' => $x1, 'y1' => $y1, 'x2' => $x2, 'y2' => $y2];

                // Area Check
                $templateId = $roomData['template_id'] ?? ($payload['template_id'] ?? null);
                if ($templateId && isset($roomTemplates[$templateId])) {
                    $totalRoomArea += $roomTemplates[$templateId]->area;
                } elseif (! empty($roomData['id'])) {
                    $existingRoom = Room::find($roomData['id']);
                    if ($existingRoom) $totalRoomArea += $existingRoom->area;
                }
            }

            if ($effectiveFloorArea > 0 && $totalRoomArea > $effectiveFloorArea) {
                 $floorName = $floorData['name'] ?? ($floor ? $floor->name : 'Mặt bằng');
                 throw new \Exception("Tổng diện tích các phòng ({$totalRoomArea} m2) vượt quá diện tích khả dụng của {$floorName} ({$effectiveFloorArea} m2).");
            }
        }
    }

    /**
     * Build raw layout data từ DB (không cache).
     */
    private function buildLayoutData(Property $property): array
    {
        $property->load([
            'floors' => fn ($q) => $q->orderBy('floor_number', 'asc'),
            'floors.rooms', // Removed ->whereNotIn('status', ['draft']) to show draft rooms
            'floors.rooms.floorPlanNode',
        ]);

        // Lấy danh sách Templates của property này
        $templates = \App\Models\Property\RoomTemplate::where('property_id', $property->id)
            ->select(['id', 'name', 'area', 'base_price', 'room_type'])
            ->get()
            ->toArray();

        return [
            'property' => $property,
            'templates' => $templates,
        ];
    }
}
