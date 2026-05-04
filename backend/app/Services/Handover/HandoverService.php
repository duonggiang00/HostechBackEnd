<?php

namespace App\Services\Handover;

use App\Enums\ContractStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\RefundReceipt;
use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Handover\HandoverMeterSnapshot;
use App\Models\Meter\MeterReading;
use App\Models\Property\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class HandoverService
{
    /** Ghi chú mặc định khi lưu biên bản thanh lý (bước wizard) nếu client không gửi `note`. */
    public const DEFAULT_TERMINATION_HANDOVER_NOTE = 'Biên bản bàn giao — thanh lý hợp đồng.';

    /**
     * Lấy danh sách Handover có phân trang & lọc
     */
    public function paginate(array $filters = [], int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return QueryBuilder::for(Handover::class)
            ->where('org_id', auth()->user()->org_id)
            ->allowedFilters([
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::callback('property_id', function ($query, $value) {
                    $query->whereHas('room', fn ($q) => $q->where('property_id', $value));
                }),
            ])
            ->allowedIncludes([
                'room',
                'room.property',
                'contract',
                'contract.primaryMember',
                'createdBy',
            ])
            ->defaultSort('-created_at')
            ->paginate($perPage);
    }

    /**
     * Lấy chi tiết Handover kèm các items, snapshots, và biên lai hoàn cọc mới nhất theo hợp đồng (nếu có).
     */
    public function getDetails(Handover $handover): Handover
    {
        $handover->load([
            'items',
            'meterSnapshots.meter',
            'room',
            'contract.members.user',
            'createdBy',
        ]);

        if ($handover->contract_id) {
            $refund = RefundReceipt::query()
                ->where('contract_id', $handover->contract_id)
                ->with(['paidBy', 'contract.property', 'contract.room'])
                ->orderByDesc('created_at')
                ->first();

            $handover->setAttribute('latest_refund_receipt', $refund);
        }

        return $handover;
    }

    /**
     * Tạo biên bản bàn giao nháp (chỉnh được khi HĐ còn trong giai đoạn thanh lý)
     */
    public function createDraft(?string $actorOrgId, array $data): Handover
    {
        $contractOrgId = null;
        $roomOrgId = null;

        if (! empty($data['contract_id'])) {
            $contractOrgId = Contract::query()->whereKey($data['contract_id'])->value('org_id');
        }
        if (! empty($data['room_id'])) {
            $roomOrgId = Room::query()->whereKey($data['room_id'])->value('org_id');
        }

        if ($contractOrgId && $roomOrgId && (string) $contractOrgId !== (string) $roomOrgId) {
            throw ValidationException::withMessages([
                'room_id' => 'Phòng không thuộc cùng tổ chức với hợp đồng.',
            ]);
        }

        $resolvedOrgId = $actorOrgId ?: $contractOrgId ?: $roomOrgId;
        if (! $resolvedOrgId) {
            throw ValidationException::withMessages([
                'org_id' => 'Không xác định được tổ chức để tạo biên bản bàn giao.',
            ]);
        }

        $data['org_id'] = $resolvedOrgId;
        if (auth()->check() && empty($data['created_by_user_id'])) {
            $data['created_by_user_id'] = auth()->id();
        }

        return DB::transaction(function () use ($data) {
            $handover = Handover::create($data);
            $handover->refresh();
            $this->syncItemsFromRoomAssets($handover);

            return $handover->fresh(['items']);
        });
    }

    /**
     * Cập nhật biên bản (chỉ khi HĐ còn cho phép chỉnh biên bản)
     */
    public function updateDraft(Handover $handover, array $data): Handover
    {
        $this->assertHandoverEditable($handover);

        $handover->update($data);

        return $handover;
    }

    /**
     * Xóa biên bản (chỉ khi HĐ còn cho phép chỉnh)
     */
    public function deleteDraft(Handover $handover): void
    {
        $this->assertHandoverEditable($handover);
        $handover->delete();
    }

    public function assertHandoverEditable(Handover $handover): void
    {
        $handover->loadMissing('contract');
        $contract = $handover->contract;
        if (! $contract) {
            throw ValidationException::withMessages([
                'handover' => 'Không tìm thấy hợp đồng gắn với biên bản.',
            ]);
        }

        if (! in_array($contract->status, ContractStatus::allowHandoverEdit(), true)) {
            throw ValidationException::withMessages([
                'handover' => 'Không thể chỉnh sửa biên bản: hợp đồng không còn trong giai đoạn thanh lý.',
            ]);
        }
    }

    /**
     * Đồng bộ danh sách item từ tài sản phòng (khi chưa có item).
     */
    public function syncItemsFromRoomAssets(Handover $handover): void
    {
        if ($handover->items()->exists()) {
            return;
        }

        $room = Room::query()->with('assets')->find($handover->room_id);
        if (! $room) {
            return;
        }

        foreach ($room->assets as $index => $asset) {
            HandoverItem::create([
                'org_id' => $handover->org_id,
                'handover_id' => $handover->id,
                'room_asset_id' => $asset->id,
                'name' => $asset->name,
                'condition' => 'OK',
                'sort_order' => $index,
            ]);
        }
    }

    /**
     * Trạng thái biên bản thanh lý: đã lưu DB hoặc chỉ xem trước từ tài sản phòng (chưa INSERT handovers).
     *
     * @return array{persisted: bool, handover: ?Handover, items: array<int, array<string, mixed>>|Collection}
     */
    public function getTerminationHandoverState(Contract $contract): array
    {
        $contract->loadMissing('room.assets');

        $handover = Handover::query()
            ->where('contract_id', $contract->id)
            ->orderByDesc('created_at')
            ->first();

        if ($handover) {
            $this->assertHandoverEditable($handover);
            $this->syncItemsFromRoomAssets($handover);
            $handover = $this->getDetails($handover->fresh());

            return [
                'persisted' => true,
                'handover' => $handover,
                'items' => $handover->items,
            ];
        }

        if (! in_array($contract->status, ContractStatus::allowHandoverEdit(), true)) {
            throw ValidationException::withMessages([
                'contract' => 'Hợp đồng không ở trạng thái cho phép lập biên bản thanh lý.',
            ]);
        }

        $previewItems = [];
        $room = $contract->room;
        if ($room) {
            foreach ($room->assets as $index => $asset) {
                $previewItems[] = [
                    'room_asset_id' => $asset->id,
                    'name' => $asset->name,
                    'condition' => 'OK',
                    'sort_order' => $index,
                    'condition_photo_urls' => [],
                ];
            }
        }

        return [
            'persisted' => false,
            'handover' => null,
            'items' => $previewItems,
        ];
    }

    /**
     * Tạo biên bản nháp trên DB (bước "Chốt số" sau khi xem trước) hoặc cập nhật bản đã có.
     *
     * @param  array<int, array{room_asset_id: string, condition?: string}>  $itemUpdates
     * @param  bool  $handoverNoteProvided  true nếu client gửi khóa `note` (kể cả null / chuỗi rỗng).
     */
    public function commitTerminationHandover(
        Contract $contract,
        array $itemUpdates,
        bool $handoverNoteProvided = false,
        ?string $handoverNote = null,
    ): Handover {
        $handover = Handover::query()
            ->where('contract_id', $contract->id)
            ->orderByDesc('created_at')
            ->first();

        if ($handover) {
            $this->assertHandoverEditable($handover);
            $this->syncItemsFromRoomAssets($handover);
            $handover = $handover->fresh();
            if ($handoverNoteProvided) {
                $handover->update(['note' => $handoverNote ?? '']);
            }
            $this->applyItemUpdatesByRoomAssetId($handover->fresh(['items']), $itemUpdates);

            return $this->getDetails($handover->fresh());
        }

        if (! in_array($contract->status, ContractStatus::allowHandoverEdit(), true)) {
            throw ValidationException::withMessages([
                'contract' => 'Hợp đồng không ở trạng thái cho phép lập biên bản thanh lý.',
            ]);
        }

        $noteToStore = $handoverNoteProvided
            ? ($handoverNote ?? '')
            : self::DEFAULT_TERMINATION_HANDOVER_NOTE;

        $handover = Handover::create([
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'room_id' => $contract->room_id,
            'created_by_user_id' => auth()->id(),
            'note' => $noteToStore,
        ]);

        $this->syncItemsFromRoomAssets($handover);
        $this->applyItemUpdatesByRoomAssetId($handover->fresh(['items']), $itemUpdates);

        return $this->getDetails($handover->fresh());
    }

    /**
     * @param  array<int, array{room_asset_id: string, condition?: string}>  $itemUpdates
     */
    private function applyItemUpdatesByRoomAssetId(Handover $handover, array $itemUpdates): void
    {
        if ($itemUpdates === []) {
            return;
        }

        $handover->loadMissing('items');
        $byAssetId = collect($itemUpdates)->keyBy(fn ($row) => (string) $row['room_asset_id']);

        foreach ($handover->items as $item) {
            $patch = $byAssetId->get((string) $item->room_asset_id);
            if (! $patch) {
                continue;
            }
            $updates = [];
            if (isset($patch['condition'])) {
                $updates['condition'] = $patch['condition'];
            }
            if ($updates !== []) {
                $item->update($updates);
            }
        }
    }

    // =========================================================================
    // Quản lý Items
    // =========================================================================

    public function getItems(Handover $handover): Collection
    {
        return $handover->items()->orderBy('sort_order')->get();
    }

    public function addItem(Handover $handover, array $data): HandoverItem
    {
        $this->assertHandoverEditable($handover);

        $data['org_id'] = $handover->org_id;
        $data['handover_id'] = $handover->id;

        return HandoverItem::create($data);
    }

    public function updateItem(HandoverItem $item, array $data): HandoverItem
    {
        $item->loadMissing('handover');
        $this->assertHandoverEditable($item->handover);

        $item->update($data);

        return $item;
    }

    public function deleteItem(HandoverItem $item): void
    {
        $item->loadMissing('handover');
        $this->assertHandoverEditable($item->handover);
        $item->delete();
    }

    // =========================================================================
    // Quản lý Meter Snapshots
    // =========================================================================

    public function getSnapshots(Handover $handover): Collection
    {
        return $handover->meterSnapshots()->with('meter')->get();
    }

    public function addSnapshot(Handover $handover, array $data): HandoverMeterSnapshot
    {
        $this->assertHandoverEditable($handover);

        $data['org_id'] = $handover->org_id;
        $data['handover_id'] = $handover->id;

        return HandoverMeterSnapshot::updateOrCreate(
            [
                'handover_id' => $handover->id,
                'meter_id' => $data['meter_id'],
            ],
            $data
        );
    }

    public function deleteSnapshot(HandoverMeterSnapshot $snapshot): void
    {
        $snapshot->loadMissing('handover');
        $this->assertHandoverEditable($snapshot->handover);
        $snapshot->delete();
    }

    /**
     * Đồng bộ HandoverMeterSnapshot từ các MeterReading đã APPROVED của phòng.
     * Gọi sau khi chốt chỉ số đồng hồ trong wizard thanh lý.
     *
     * @param  string[]  $meterIds  Giới hạn đồng bộ các meter cụ thể; [] = tất cả meter của phòng.
     */
    public function syncSnapshotsFromApprovedReadings(Handover $handover, array $meterIds = []): void
    {
        if (! $handover->room_id) {
            return;
        }

        $query = MeterReading::query()
            ->where('status', 'APPROVED')
            ->whereHas('meter', fn ($q) => $q->where('room_id', $handover->room_id))
            ->with('meter')
            ->orderByDesc('period_end');

        if (! empty($meterIds)) {
            $query->whereIn('meter_id', $meterIds);
        }

        // Lấy chỉ số APPROVED mới nhất theo từng meter (không giới hạn kỳ — lấy kỳ cuối).
        $latestByMeter = $query->get()->unique('meter_id');

        foreach ($latestByMeter as $reading) {
            HandoverMeterSnapshot::updateOrCreate(
                [
                    'handover_id' => $handover->id,
                    'meter_id' => $reading->meter_id,
                ],
                [
                    'org_id' => $handover->org_id,
                    'reading_value' => (int) $reading->reading_value,
                ]
            );
        }
    }

    /**
     * Đảm bảo có handover + items trước khi pipeline thanh lý bắn HandoverSubmitted.
     */
    public function ensureHandoverExistsForTermination(Contract $contract, ?string $actorUserId = null): Handover
    {
        $handover = Handover::query()
            ->where('contract_id', $contract->id)
            ->orderByDesc('created_at')
            ->first();

        if (! $handover) {
            $handover = Handover::create([
                'org_id' => $contract->org_id,
                'contract_id' => $contract->id,
                'room_id' => $contract->room_id,
                'created_by_user_id' => $actorUserId,
                'note' => 'Tự động tạo khi thanh lý hợp đồng.',
            ]);
        }

        $this->syncItemsFromRoomAssets($handover);

        return $handover->fresh();
    }
}
