<?php

namespace App\Listeners\Contract\Termination;

use App\Events\Contract\Termination\TerminationInitiated;
use App\Models\Meter\Meter;
use App\Services\Handover\HandoverService;
use Illuminate\Support\Facades\DB;

class TerminationInitiatedCreateHandoverAndLockMeters
{
    public function handle(TerminationInitiated $event): void
    {
        DB::transaction(function () use ($event) {
            $contract = $event->contract->fresh();

            app(HandoverService::class)->ensureHandoverExistsForTermination(
                $contract,
                auth()->check() ? auth()->id() : null
            );

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
