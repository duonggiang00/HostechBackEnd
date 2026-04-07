<?php

namespace App\Observers;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractStatusHistory;
use App\Models\Property\RoomStatusHistory;
use Illuminate\Support\Facades\Cache;
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

    public function saved(Contract $contract): void
    {
        $this->invalidateCache($contract);
    }

    public function deleted(Contract $contract): void
    {
        $this->invalidateCache($contract);
    }

    /**
     * Ghi lịch sử trước khi cập nhật (để bắt được trạng thái cũ)
     */
    public function updating(Contract $contract): void
    {
        if (! $contract->isDirty('status')) {
            return;
        }

        $fromStatus = $contract->getOriginal('status');
        $toStatus   = $contract->status;

        // Chuyển Enum thành string nếu cần
        $fromStatusValue = $fromStatus instanceof \BackedEnum ? $fromStatus->value : (string) $fromStatus;
        $toStatusValue   = $toStatus   instanceof \BackedEnum ? $toStatus->value   : (string) $toStatus;

        ContractStatusHistory::create([
            'org_id'             => $contract->org_id,
            'contract_id'        => $contract->id,
            'from_status'        => $fromStatusValue ?: null,
            'to_status'          => $toStatusValue,
            'changed_by_user_id' => auth()->id(),
            'notes'              => $this->generateNotes($fromStatusValue, $toStatusValue),
        ]);
    }

    /**
     * Handle the Contract "updated" event.
     */
    public function updated(Contract $contract): void
    {
        if ($contract->isDirty('status')) {
            $this->syncRoomStatus($contract);
        }
    }

    /**
     * Sinh ghi chú tự động dựa trên luồng chuyển trạng thái.
     */
    private function generateNotes(string $from, string $to): string
    {
        return match ("{$from}->{$to}") {
            'DRAFT->PENDING_SIGNATURE'           => 'Hợp đồng được gửi cho khách ký.',
            'PENDING_SIGNATURE->PENDING_PAYMENT' => 'Khách đã ký xác nhận, chờ thanh toán cọc + tiền phòng.',
            'PENDING_SIGNATURE->DRAFT'           => 'Khách từ chối ký. Hợp đồng quay lại bản nháp.',
            'PENDING_PAYMENT->ACTIVE'            => 'Thanh toán được xác nhận. Hợp đồng bắt đầu hiệu lực.',
            'ACTIVE->PENDING_TERMINATION'        => 'Tenant đã gửi thông báo dời đi. Chờ Manager xác nhận thanh lý.',
            'ACTIVE->TERMINATED'                 => 'Hợp đồng được thanh lý (kết thúc đúng hạn hoặc thỏa thuận).',
            'ACTIVE->CANCELLED'                  => 'Hợp đồng bị hủy ngang (phạt cọc do vi phạm điều khoản).',
            'ACTIVE->EXPIRED'                    => 'Hợp đồng đã qua ngày kết thúc, chờ Manager xử lý.',
            'PENDING_TERMINATION->TERMINATED'    => 'Manager xác nhận thanh lý. Hợp đồng kết thúc.',
            'PENDING_TERMINATION->CANCELLED'     => 'Manager xác nhận hủy (phạt cọc do vi phạm điều khoản).',
            'EXPIRED->TERMINATED'                => 'Manager đã xử lý hợp đồng hết hạn. Hoàn tất thanh lý.',
            default                              => "Chuyển trạng thái từ {$from} sang {$to}.",
        };
    }

    /**
     * Synchronize the associated Room status based on the current Contract status.
     */
    protected function syncRoomStatus(Contract $contract): void
    {
        $room = $contract->room;
        if (! $room) {
            return;
        }

        $oldStatus = $room->status;
        $newStatus = $oldStatus;

        if ($contract->status === 'ACTIVE') {
            $newStatus = 'occupied';
        } elseif (in_array($contract->status instanceof \BackedEnum ? $contract->status->value : $contract->status, [
            'ENDED', 'CANCELLED', 'TERMINATED', 'EXPIRED',
        ])) {
            // Chỉ free phòng nếu không còn hợp đồng ACTIVE nào khác
            $hasOtherActive = $room->contracts()
                ->where('id', '!=', $contract->id)
                ->where('status', 'ACTIVE')
                ->exists();

            if (! $hasOtherActive) {
                $newStatus = 'available';
            }
        }

        if ($newStatus !== $oldStatus) {
            $room->update(['status' => $newStatus]);

            RoomStatusHistory::create([
                'id'                 => Str::uuid()->toString(),
                'org_id'             => $room->org_id,
                'room_id'            => $room->id,
                'from_status'        => $oldStatus,
                'to_status'          => $newStatus,
                'reason'             => 'Status auto-synced from Contract status (' . ($contract->status instanceof \BackedEnum ? $contract->status->value : $contract->status) . ')',
                'changed_by_user_id' => auth()->id() ?? $contract->created_by_user_id,
            ]);
        }
    }

    /**
     * Xóa cache building overview của tòa nhà liên quan đến hợp đồng này.
     */
    private function invalidateCache(Contract $contract): void
    {
        if ($contract->property_id) {
            Cache::forget("building_overview_{$contract->property_id}");
        }
    }
}
