<?php

namespace App\Features\Handover\Services;

use App\Features\Handover\Models\Handover;
use App\Features\Handover\Models\HandoverItem;
use App\Features\Handover\Models\HandoverMeterSnapshot;
use App\Features\Org\Models\Org;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log; // For potential use or just clean
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class HandoverService
{
    /**
     * Lấy danh sách Handover có phân trang & lọc
     */
    public function paginate(array $filters = [], int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return QueryBuilder::for(Handover::class)
            ->where('org_id', auth()->user()->org_id)
            ->allowedFilters([
                AllowedFilter::exact('type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('contract_id'),
            ])
            ->allowedIncludes(['room', 'contract', 'confirmedBy'])
            ->defaultSort('-created_at')
            ->paginate($perPage);
    }

    /**
     * Lấy chi tiết Handover kèm các items, snapshots
     */
    public function getDetails(Handover $handover): Handover
    {
        $handover->load([
            'items',
            'meterSnapshots.meter',
            'room',
            'contract',
            'confirmedBy',
        ]);

        return $handover;
    }

    /**
     * Tạo biên bản bàn giao nháp (DRAFT)
     */
    public function createDraft(Org $org, array $data): Handover
    {
        $data['org_id'] = $org->id;
        $data['status'] = 'DRAFT';

        return DB::transaction(function () use ($data) {
            $handover = Handover::create($data);

            if (!empty($data['room_id'])) {
                $roomId = $data['room_id'];
                
                // 1. Auto clone room assets -> HandoverItems
                $assets = \App\Features\Property\Models\RoomAsset::where('room_id', $roomId)->get();
                $itemsToInsert = [];
                foreach ($assets as $asset) {
                    $itemsToInsert[] = [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'org_id' => $data['org_id'],
                        'handover_id' => $handover->id,
                        'room_asset_id' => $asset->id,
                        'name' => $asset->name,
                        'status' => 'OK',
                        'note' => $asset->condition ? 'Tình trạng: ' . $asset->condition : '',
                        'sort_order' => 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                if (!empty($itemsToInsert)) {
                    \App\Features\Handover\Models\HandoverItem::insert($itemsToInsert);
                }

                // 2. Auto clone active meters -> HandoverMeterSnapshots
                $meters = \App\Features\Meter\Models\Meter::where('room_id', $roomId)->where('is_active', true)->get();
                $snapshotsToInsert = [];
                foreach ($meters as $meter) {
                    $readingValue = null;
                    if (($data['type'] ?? '') === 'CHECKOUT') {
                        $lastReading = \App\Features\Meter\Models\MeterReading::where('meter_id', $meter->id)
                            ->latest('period_end')
                            ->first();
                        if ($lastReading) {
                            $readingValue = $lastReading->reading_value;
                        }
                    }

                    $snapshotsToInsert[] = [
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'org_id' => $data['org_id'],
                        'handover_id' => $handover->id,
                        'meter_id' => $meter->id,
                        'reading_value' => $readingValue,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
                if (!empty($snapshotsToInsert)) {
                    \App\Features\Handover\Models\HandoverMeterSnapshot::insert($snapshotsToInsert);
                }
            }

            return $handover;
        });
    }

    /**
     * Cập nhật biên bản (chỉ cho phép khi còn là DRAFT)
     */
    public function updateDraft(Handover $handover, array $data): Handover
    {
        $this->ensureIsDraft($handover);

        $handover->update($data);

        return $handover;
    }

    /**
     * Xóa biên bản nháp
     */
    public function deleteDraft(Handover $handover): void
    {
        $this->ensureIsDraft($handover);
        $handover->delete();
    }

    /**
     * Chốt biên bản (CONFIRM). Khóa lại không cho sửa đổi.
     */
    public function confirm(Handover $handover, string $userId): Handover
    {
        $this->ensureIsDraft($handover);

        DB::transaction(function () use ($handover, $userId) {
            $handover->update([
                'status' => 'CONFIRMED',
                'confirmed_by_user_id' => $userId,
                'confirmed_at' => now(),
                'locked_at' => now(),
            ]);
        });

        return $handover;
    }

    /**
     * Kiểm tra trạng thái DRAFT
     */
    private function ensureIsDraft(Handover $handover): void
    {
        if ($handover->status !== 'DRAFT' || $handover->locked_at !== null) {
            throw ValidationException::withMessages([
                'status' => 'Không thể chỉnh sửa biên bản đã xác nhận (CONFIRMED) hoặc đã khóa.',
            ]);
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
        $this->ensureIsDraft($handover);

        $data['org_id'] = $handover->org_id;
        $data['handover_id'] = $handover->id;

        return HandoverItem::create($data);
    }

    public function updateItem(HandoverItem $item, array $data): HandoverItem
    {
        $item->loadMissing('handover');
        $this->ensureIsDraft($item->handover);

        $item->update($data);

        return $item;
    }

    public function deleteItem(HandoverItem $item): void
    {
        $item->loadMissing('handover');
        $this->ensureIsDraft($item->handover);
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
        $this->ensureIsDraft($handover);

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
        $this->ensureIsDraft($snapshot->handover);
        $snapshot->delete();
    }
}
