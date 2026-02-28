<?php

namespace App\Services\Handover;

use App\Models\Handover\Handover;
use App\Models\Handover\HandoverItem;
use App\Models\Handover\HandoverMeterSnapshot;
use App\Models\Org\Org;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class HandoverService
{
    /**
     * Lấy danh sách Handover có phân trang & lọc
     */
    public function paginate(Org $org, int $perPage = 15)
    {
        return QueryBuilder::for(Handover::class)
            ->where('org_id', $org->id)
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
    public function getDetails(Handover $handover)
    {
        $handover->load([
            'items', 
            'meterSnapshots.meter', 
            'room', 
            'contract', 
            'confirmedBy'
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
            
            // Tương lai: Có thể auto clone danh sách từ room_assets vào handover_items ở đây
            
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
                'status' => 'Không thể chỉnh sửa biên bản đã xác nhận (CONFIRMED) hoặc đã khóa.'
            ]);
        }
    }

    // =========================================================================
    // Quản lý Items
    // =========================================================================

    public function getItems(Handover $handover)
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
        $this->ensureIsDraft($item->handover);
        
        $item->update($data);
        return $item;
    }

    public function deleteItem(HandoverItem $item): void
    {
        $this->ensureIsDraft($item->handover);
        $item->delete();
    }

    // =========================================================================
    // Quản lý Meter Snapshots
    // =========================================================================

    public function getSnapshots(Handover $handover)
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
                'meter_id' => $data['meter_id']
            ],
            $data
        );
    }

    public function deleteSnapshot(HandoverMeterSnapshot $snapshot): void
    {
        $this->ensureIsDraft($snapshot->handover);
        $snapshot->delete();
    }
}
