<?php

namespace App\Listeners\Contract\Termination;

use App\Events\Contract\Termination\TerminationInitiated;
use App\Models\Handover\Handover;
use App\Models\Meter\Meter;
use Illuminate\Support\Facades\DB;

class TerminationInitiatedCreateHandoverAndLockMeters
{
    public function handle(TerminationInitiated $event): void
    {
        DB::transaction(function () use ($event) {
            $contract = $event->contract->fresh();

            if (! Handover::query()->where('contract_id', $contract->id)->exists()) {
                Handover::query()->create([
                    'org_id' => $contract->org_id,
                    'contract_id' => $contract->id,
                    'room_id' => $contract->room_id,
                    'type' => 'OUT',
                    'status' => 'DRAFT',
                    'note' => 'Tự động tạo khi khởi tạo thanh lý (EDA).',
                ]);
            }

            Meter::query()
                ->where('room_id', $contract->room_id)
                ->whereIn('type', ['ELECTRIC', 'WATER'])
                ->each(function (Meter $meter) {
                    $meta = $meter->meta ?? [];
                    $meta['termination_pipeline_locked_at'] = now()->toIso8601String();
                    $meter->update(['meta' => $meta]);
                });
        });
    }
}
