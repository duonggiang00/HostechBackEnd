<?php

namespace App\Features\Contract\Observers;

use App\Features\Contract\Models\Contract;
use App\Features\Contract\Enums\ContractStatus;
use App\Features\Property\Models\RoomStatusHistory;
use Illuminate\Support\Str;

class ContractObserver
{
    /**
     * Handle the Contract "created" event.
     */
    public function created(Contract $contract): void
    {
        $this->syncRoomStatus($contract);
    }

    /**
     * Handle the Contract "updated" event.
     */
    public function updated(Contract $contract): void
    {
        if ($contract->wasChanged('status')) {
            $this->syncRoomStatus($contract);
        }
    }

    /**
     * Handle the Contract "deleted" event.
     */
    public function deleted(Contract $contract): void
    {
        $room = $contract->room;
        if ($room) {
            $oldStatus = $room->status;
            $newStatus = 'available';

            if ($oldStatus !== $newStatus) {
                $room->update(['status' => $newStatus]);
                
                RoomStatusHistory::create([
                    'id' => (string) Str::uuid(),
                    'org_id' => $room->org_id,
                    'room_id' => $room->id,
                    'from_status' => $oldStatus,
                    'to_status' => $newStatus,
                    'reason' => 'Hợp đồng bị xóa',
                    'changed_by_user_id' => auth()->id() ?? $contract->created_by_user_id,
                ]);
            }
        }
    }

    /**
     * Sync room status based on contract status.
     */
    protected function syncRoomStatus(Contract $contract): void
    {
        $room = $contract->room;
        if (!$room) {
            return;
        }

        $oldStatus = $room->status;
        $newStatus = $oldStatus;
        $reason = '';

        switch ($contract->status) {
            case ContractStatus::ACTIVE:
                $newStatus = 'occupied';
                $reason = 'Hợp đồng có hiệu lực';
                break;
            case ContractStatus::TERMINATED:
            case ContractStatus::EXPIRED:
            case ContractStatus::CANCELLED:
                $newStatus = 'available';
                $reason = 'Hợp đồng kết thúc/hết hạn (' . ($contract->status->value ?? $contract->status) . ')';
                break;
            case ContractStatus::PENDING_SIGNATURE:
            case ContractStatus::PENDING_PAYMENT:
                // Thường thì phòng vẫn được giữ chỗ hoặc đang trống cho đến khi kích hoạt
                break;
        }

        if ($oldStatus !== $newStatus) {
            $room->update(['status' => $newStatus]);
            
            RoomStatusHistory::create([
                'id' => (string) Str::uuid(),
                'org_id' => $room->org_id,
                'room_id' => $room->id,
                'from_status' => $oldStatus,
                'to_status' => $newStatus,
                'reason' => $reason,
                'changed_by_user_id' => auth()->id() ?? $contract->created_by_user_id,
            ]);
        }
    }
}
