<?php

namespace App\Services\Property;

use App\Events\Property\BuildingOverviewUpdated;
use App\Jobs\Property\ApplyTemplateAssetsAfterOverviewSyncJob;
use App\Jobs\Property\CopyTemplateGalleryAfterOverviewSyncJob;
use App\Models\Org\User;
use App\Models\Property\Floor;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Property\RoomFloorPlanNode;
use App\Models\Property\RoomTemplate;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BuildingOverviewService
{
    /** @var array<string, Floor|null> Tránh N lần Floor::find khi tạo nhiều phòng cùng tầng trong một lần sync. */
    private array $floorAllocationCache = [];

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
     *
     * @param  string|null  $idempotencyKey  Cùng key + cùng property: lần sau chỉ trả layout hiện tại, không tạo phòng trùng.
     */
    public function syncLayout(Property $property, array $payload, User $user, ?string $idempotencyKey = null): array
    {
        if ($idempotencyKey) {
            return Cache::lock("building_overview_sync:{$property->id}:{$idempotencyKey}", 120)->block(30, function () use ($property, $payload, $user, $idempotencyKey) {
                return $this->runSyncLayoutTransaction($property, $payload, $user, $idempotencyKey);
            });
        }

        return $this->runSyncLayoutTransaction($property, $payload, $user, null);
    }

    /**
     * @param  string|null  $idempotencyKey  Đã ghi trong DB cùng transaction khi sync thành công.
     */
    private function runSyncLayoutTransaction(Property $property, array $payload, User $user, ?string $idempotencyKey): array
    {
        $payloadHash = $idempotencyKey ? $this->syncPayloadFingerprint($payload) : null;

        if ($idempotencyKey) {
            $existing = $this->findBuildingOverviewSyncIdempotency($property->id, $idempotencyKey);
            if ($existing) {
                if (! hash_equals((string) $existing->payload_hash, (string) $payloadHash)) {
                    throw ValidationException::withMessages([
                        'idempotency_key' => 'Mã idempotency đã gắn với bản lưu khác. Hãy lưu lại để tạo mã mới, hoặc tải lại trang.',
                    ]);
                }

                return $this->buildLayoutData($property);
            }
        }

        $this->floorAllocationCache = [];

        // 0. Pre-flight validation
        $this->validateSync($property, $payload);

        /** @var list<array{room_id: string, template_id: string}> */
        $galleryCopyPairs = [];

        $layout = DB::transaction(function () use ($property, $payload, $user, &$galleryCopyPairs, $idempotencyKey, $payloadHash) {
            $summary = [
                'floors_added' => 0,
                'rooms_added' => 0,
                'rooms_moved' => 0,
                'rooms_deleted' => 0,
                'floors_deleted' => 0,
            ];

            $roomCodesScratch = Room::withTrashed()
                ->where('property_id', $property->id)
                ->pluck('code')
                ->map(fn ($c) => (string) $c)
                ->values()
                ->all();

            /** @var array<string, RoomTemplate> */
            $roomTemplateCache = [];

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
                    $freshRoom = null;
                    $roomId = $this->resolveRoomId(
                        $roomData,
                        $property,
                        $floorId,
                        $payload['template_id'] ?? null,
                        $user,
                        $summary,
                        $roomCodesScratch,
                        $roomTemplateCache,
                        $galleryCopyPairs,
                        $freshRoom,
                    );

                    if (! $roomId) {
                        continue;
                    }

                    // 5. Override vị trí Grid (x, y, width, height)
                    $room = $freshRoom ?? Room::find($roomId);
                    if ($room) {
                        RoomFloorPlanNode::updateOrCreate(
                            ['room_id' => $roomId],                 // search key
                            [
                                'org_id' => $property->org_id,   // update values only
                                'floor_id' => $floorId,
                                'x' => (int) $roomData['x'],
                                'y' => (int) ($roomData['y'] ?? 0),
                                'width' => (int) ($roomData['width'] ?? 1),
                                'height' => (int) ($roomData['height'] ?? 1),
                            ]
                        );
                        $summary['rooms_moved']++;
                    }
                }
            }

            if ($idempotencyKey && $payloadHash) {
                $this->recordBuildingOverviewSyncIdempotency($property->id, $idempotencyKey, $payloadHash);
            }

            // 6. Phát event để clear cache và trigger các side-effects
            BuildingOverviewUpdated::dispatch($property->id, $user->id, $summary);

            return $this->buildLayoutData($property);
        });

        $this->queueDeferredTemplateCloneAfterOverviewSync($galleryCopyPairs);

        return $layout;
    }

    private function findBuildingOverviewSyncIdempotency(string $propertyId, string $idempotencyKey): ?object
    {
        return DB::table('building_overview_sync_idempotencies')
            ->where('property_id', $propertyId)
            ->where('idempotency_key', $idempotencyKey)
            ->first();
    }

    /**
     * @return non-falsy-string
     */
    private function syncPayloadFingerprint(array $payload): string
    {
        return hash('sha256', json_encode(Arr::sortRecursive($payload), JSON_UNESCAPED_UNICODE));
    }

    private function recordBuildingOverviewSyncIdempotency(string $propertyId, string $idempotencyKey, string $payloadHash): void
    {
        DB::table('building_overview_sync_idempotencies')->insert([
            'id' => (string) Str::uuid(),
            'property_id' => $propertyId,
            'idempotency_key' => $idempotencyKey,
            'payload_hash' => $payloadHash,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Tách khỏi XHR: (1) clone room_assets từ template, (2) copy gallery — mỗi phần một job khi queue ≠ sync.
     */
    private function queueDeferredTemplateCloneAfterOverviewSync(array $templateClonePairs): void
    {
        if ($templateClonePairs === []) {
            return;
        }

        if (config('queue.default') !== 'sync') {
            ApplyTemplateAssetsAfterOverviewSyncJob::dispatch($templateClonePairs);
            CopyTemplateGalleryAfterOverviewSyncJob::dispatch($templateClonePairs);

            return;
        }

        $roomService = $this->roomService;
        register_shutdown_function(static function () use ($templateClonePairs, $roomService): void {
            if (function_exists('fastcgi_finish_request')) {
                fastcgi_finish_request();
            }
            $roomService->applyTemplateAssetsForOverviewPairs($templateClonePairs);
            $roomService->copyTemplateGalleryForOverviewPairs($templateClonePairs);
        });
    }

    // ─── Private Helpers ─────────────────────────────────────────────────

    /**
     * Sinh mã phòng: tầng trệt G{STT:2}, các tầng khác {số_tầng}{STT:2} (vd. 101, 401, 1201).
     *
     * Ràng buộc DB: (property_id, code) là unique — kể cả phòng soft-deleted vẫn chiếm mã.
     *
     * @param  list<string>  $roomCodesScratch  Mã phòng hiện có + mã vừa gán trong cùng request (tránh N query).
     */
    private function allocateNextRoomCodeByFloorPattern(string $floorId, array &$roomCodesScratch): string
    {
        if (! array_key_exists($floorId, $this->floorAllocationCache)) {
            $this->floorAllocationCache[$floorId] = Floor::find($floorId);
        }
        $floor = $this->floorAllocationCache[$floorId];
        $floorNumber = $floor ? (int) $floor->floor_number : 0;
        $prefix = $floorNumber === 0 ? 'G' : (string) $floorNumber;

        $usedSequences = [];
        foreach ($roomCodesScratch as $c) {
            if ($c === '' || ! str_starts_with($c, $prefix)) {
                continue;
            }
            $suffix = substr($c, strlen($prefix));
            if (preg_match('/^(\d{2})$/', $suffix, $m)) {
                $usedSequences[(int) $m[1]] = true;
            }
        }

        $sequence = 1;
        while (isset($usedSequences[$sequence])) {
            $sequence++;
        }

        $label = $prefix.str_pad((string) $sequence, 2, '0', STR_PAD_LEFT);
        $roomCodesScratch[] = $label;

        return $label;
    }

    /**
     * Mã phòng (unique theo property): ưu tiên code client nếu chưa trùng (kể cả soft-delete),
     * không thì fallback auto theo tầng. Chỉ scratch/kiểm tra trùng trên code.
     *
     * @param  list<string>  $roomCodesScratch
     */
    private function resolveRoomCodeFromClientOrAuto(array $roomData, string $floorId, array &$roomCodesScratch): string
    {
        $clientCode = isset($roomData['code']) ? trim((string) $roomData['code']) : '';
        if ($clientCode !== '' && ! $this->isRoomCodeTakenInScratch($clientCode, $roomCodesScratch)) {
            $roomCodesScratch[] = $clientCode;

            return $clientCode;
        }

        return $this->allocateNextRoomCodeByFloorPattern($floorId, $roomCodesScratch);
    }

    /**
     * Tên hiển thị — không bắt unique; mặc định theo code đã resolve nếu client không gửi name.
     */
    private function resolveRoomDisplayName(array $roomData, string $resolvedCode): string
    {
        $name = isset($roomData['name']) ? trim((string) $roomData['name']) : '';

        return $name !== '' ? $name : $resolvedCode;
    }

    /**
     * So sánh không phân biệt hoa thường để khớp unique index trên DB collation mặc định.
     *
     * @param  list<string>  $roomCodesScratch
     */
    private function isRoomCodeTakenInScratch(string $candidate, array $roomCodesScratch): bool
    {
        $candidateLower = mb_strtolower($candidate);
        foreach ($roomCodesScratch as $existing) {
            if (mb_strtolower((string) $existing) === $candidateLower) {
                return true;
            }
        }

        return false;
    }

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
            $floorName = $floorData['name'] ?? "Tầng {$floorNumber}";

            $floor = Floor::create([
                'org_id' => $property->org_id,
                'property_id' => $property->id,
                'name' => $floorName,
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
        array &$summary,
        array &$roomCodesScratch,
        array &$roomTemplateCache,
        array &$galleryCopyPairs,
        ?Room &$freshRoom,
    ): ?string {
        $freshRoom = null;

        // Phòng CŨ — đã có ID thực, chỉ cập nhật vị trí
        if (! empty($roomData['id'])) {
            return $roomData['id'];
        }

        // Phòng MỚI — có temp_id
        if (! empty($roomData['temp_id'])) {
            $templateId = $roomData['template_id'] ?? $globalTemplateId;

            // Chỉ (property_id, code) là unique — name là nhãn hiển thị, gửi riêng từ client.
            $roomCode = $this->resolveRoomCodeFromClientOrAuto($roomData, $floorId, $roomCodesScratch);
            $roomName = $this->resolveRoomDisplayName($roomData, $roomCode);

            if ($templateId) {
                if (! isset($roomTemplateCache[$templateId])) {
                    $roomTemplateCache[$templateId] = RoomTemplate::with(['services', 'assets'])->findOrFail($templateId);
                }

                // Không copy gallery từ template (rất chậm khi tạo nhiều ô trên sơ đồ); API tạo phòng đơn lẻ vẫn copy đầy đủ.
                $room = $this->roomService->createFromTemplate(
                    $templateId,
                    [
                        'property_id' => $property->id,
                        'floor_id' => $floorId,
                        'name' => $roomName,
                        'code' => $roomCode,
                        'status' => 'available',
                    ],
                    $user,
                    false,
                    $roomTemplateCache[$templateId],
                    true,
                    true,
                    true,
                );

                $galleryCopyPairs[] = ['room_id' => $room->id, 'template_id' => $templateId];
            } else {
                // Tạo nhanh không dùng template — Observer tạo FloorPlanNode + 2 Meters mặc định
                $room = $this->roomService->quickCreate([
                    'property_id' => $property->id,
                    'floor_id' => $floorId,
                    'name' => $roomName,
                    'code' => $roomCode,
                ], $user);
            }

            $summary['rooms_added']++;
            $freshRoom = $room;

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
                throw new \Exception('Không thể xóa tầng đang có chứa phòng: '.implode(', ', $floorsWithRooms).'. Vui lòng chuyển hoặc xóa phòng trước.');
            }
        }

        // 2. Chặn xóa phòng đang có người ở
        if (! empty($payload['deleted_room_ids'])) {
            $occupiedRooms = Room::whereIn('id', $payload['deleted_room_ids'])
                ->where('status', 'occupied')
                ->pluck('code')
                ->toArray();

            if (! empty($occupiedRooms)) {
                throw new \Exception('Không thể xóa các phòng đang có người ở: '.implode(', ', $occupiedRooms));
            }
        }

        // 3. Chặn đè phòng (Overlap) & Kiểm tra Diện tích (Area Capacity) per floor
        $roomTemplates = RoomTemplate::where('property_id', $property->id)->get()->keyBy('id');

        $syncRoomIds = [];
        foreach ($payload['sync_data'] ?? [] as $floorData) {
            foreach ($floorData['rooms'] ?? [] as $roomData) {
                if (! empty($roomData['id'])) {
                    $syncRoomIds[] = (string) $roomData['id'];
                }
            }
        }
        $syncRoomIds = array_values(array_unique($syncRoomIds));
        $roomsByIdForValidation = $syncRoomIds === []
            ? collect()
            : Room::whereIn('id', $syncRoomIds)
                ->where('property_id', $property->id)
                ->get()
                ->keyBy(fn (Room $r) => (string) $r->id);

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
                            $room = $roomsByIdForValidation->get((string) $roomData['id']);
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
                    $existingRoom = $roomsByIdForValidation->get((string) $roomData['id']);
                    if ($existingRoom) {
                        $totalRoomArea += $existingRoom->area;
                    }
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
        $templates = RoomTemplate::where('property_id', $property->id)
            ->select(['id', 'name', 'area', 'base_price'])
            ->get()
            ->map(fn ($tpl) => [
                'id' => $tpl->id,
                'name' => $tpl->name,
                'area' => (float) $tpl->area,
                'base_price' => (float) $tpl->base_price,
            ])
            ->toArray();

        return [
            'property' => $property,
            'templates' => $templates,
        ];
    }
}
