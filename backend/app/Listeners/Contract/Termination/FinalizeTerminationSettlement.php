<?php

namespace App\Listeners\Contract\Termination;

use App\Enums\ContractStatus;
use App\Events\Contract\Termination\SettlementResolved;
use App\Models\Contract\Contract;
use Illuminate\Support\Facades\DB;

/**
 * Hoàn tất trạng thái hợp đồng sau khi quyết toán xong (không còn nợ phải thu thêm).
 */
class FinalizeTerminationSettlement
{
    public function handle(SettlementResolved $event): void
    {
        DB::transaction(function () use ($event) {
            $contract = Contract::query()->findOrFail($event->contract->id);

            if ($contract->status === ContractStatus::PENDING_SETTLEMENT) {
                return;
            }

            $contract->update([
                'status' => ContractStatus::TERMINATED,
                'terminated_at' => now(),
            ]);

            $contract->room?->update(['status' => 'available']);
        });
    }
}
