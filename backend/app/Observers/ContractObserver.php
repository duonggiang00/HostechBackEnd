<?php

namespace App\Observers;

use App\Features\Contract\Models\Contract;
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
        if ($contract->isDirty('status')) {
            $this->syncRoomStatus($contract);
        }
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
        } elseif (in_array($contract->status, ['ENDED', 'CANCELLED'])) {
            // Check if any other ACTIVE contract exists for this room
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
                'id' => Str::uuid()->toString(),
                'org_id' => $room->org_id,
                'room_id' => $room->id,
                'from_status' => $oldStatus,
                'to_status' => $newStatus,
                'reason' => "Status auto-synced from Contract status ({$contract->status})",
                'changed_by_user_id' => auth()->id() ?? $contract->created_by_user_id,
            ]);
        }
    }
}
