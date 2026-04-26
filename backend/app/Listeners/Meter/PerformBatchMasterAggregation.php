<?php

namespace App\Listeners\Meter;

use App\Events\Meter\BulkMeterReadingsApproved;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Handles master meter aggregation for a BATCH of approved readings.
 *
 * Instead of running N jobs (one per reading), this listener:
 *  1. Loads all readings with eager-loaded meter (1 query).
 *  2. Groups them by (property_id, meter_type, period_end).
 *  3. For each unique group, acquires ONE lock and runs ONE transaction
 *     to SUM consumption and updateOrCreate the master meter reading.
 *
 * This replaces the N×(lock + transaction) pattern from PerformMasterAggregation.
 */
class PerformBatchMasterAggregation implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the queue the job should be sent to.
     */
    public string $queue = 'billing';

    /**
     * Handle the event.
     */
    public function handle(BulkMeterReadingsApproved $event): void
    {
        $readingIds = $event->readingIds;

        if (empty($readingIds)) {
            return;
        }

        // 1. Load all readings with meter in ONE query (eager loading)
        $readings = MeterReading::with('meter')
            ->whereIn('id', $readingIds)
            ->where('status', 'APPROVED')
            ->get();

        // 2. Filter out master meters and readings without property link
        $roomReadings = $readings->filter(
            fn($r) => $r->meter && !$r->meter->is_master && $r->meter->property_id
        );

        if ($roomReadings->isEmpty()) {
            return;
        }

        // 3. Group by the unique aggregation key: property + meter_type + period_end
        $groups = $roomReadings->groupBy(function ($reading) {
            $periodEnd = $reading->period_end instanceof \Carbon\Carbon
                ? $reading->period_end->format('Y-m-d')
                : \Carbon\Carbon::parse($reading->period_end)->format('Y-m-d');

            return $reading->meter->property_id
                . '_' . $reading->meter->type
                . '_' . $periodEnd;
        });

        // 4. Process each group with a single lock + transaction
        foreach ($groups as $groupKey => $groupReadings) {
            $this->aggregateGroup($groupReadings);
        }
    }

    /**
     * Aggregate one group (same property + meter_type + period) into the master meter.
     */
    protected function aggregateGroup(\Illuminate\Support\Collection $groupReadings): void
    {
        $firstReading = $groupReadings->first();
        $meter = $firstReading->meter;

        $masterMeter = Meter::where('property_id', $meter->property_id)
            ->where('type', $meter->type)
            ->where('is_master', true)
            ->first();

        if (!$masterMeter) {
            return;
        }

        $periodStartStr = $firstReading->period_start instanceof \Carbon\Carbon
            ? $firstReading->period_start->format('Y-m-d')
            : \Carbon\Carbon::parse($firstReading->period_start)->format('Y-m-d');

        $periodEndStr = $firstReading->period_end instanceof \Carbon\Carbon
            ? $firstReading->period_end->format('Y-m-d')
            : \Carbon\Carbon::parse($firstReading->period_end)->format('Y-m-d');

        $lockKey = "aggregation_lock_{$masterMeter->id}_{$periodEndStr}";
        $lock = Cache::lock($lockKey, 30);

        try {
            $lock->block(15);

            DB::transaction(function () use ($masterMeter, $periodStartStr, $periodEndStr, $firstReading) {
                // SUM consumption from ALL approved room meters for this period (1 query)
                $totalUsage = MeterReading::whereHas('meter', function ($q) use ($masterMeter) {
                    $q->where('property_id', $masterMeter->property_id)
                        ->where('type', $masterMeter->type)
                        ->where('is_master', false);
                })
                    ->whereDate('period_start', $periodStartStr)
                    ->whereDate('period_end', $periodEndStr)
                    ->where('status', 'APPROVED')
                    ->sum('consumption');

                // Ensure initial reading anchor exists
                if (!isset($masterMeter->meta['initial_reading'])) {
                    $meta = $masterMeter->meta ?? [];
                    $meta['initial_reading'] = $masterMeter->base_reading;
                    $masterMeter->update(['meta' => $meta]);
                    $masterMeter->refresh();
                }

                // Get the previous master reading for cumulative calculation
                $prevMaster = MeterReading::where('meter_id', $masterMeter->id)
                    ->whereDate('period_end', '<=', $periodStartStr)
                    ->where('status', 'APPROVED')
                    ->orderBy('period_end', 'desc')
                    ->first();

                $initial = $masterMeter->meta['initial_reading'] ?? $masterMeter->base_reading;
                $prevValue = $prevMaster ? $prevMaster->reading_value : $initial;

                MeterReading::updateOrCreate(
                    [
                        'meter_id'     => $masterMeter->id,
                        'period_start' => $periodStartStr,
                        'period_end'   => $periodEndStr,
                    ],
                    [
                        'reading_value' => $prevValue + $totalUsage,
                        'consumption'   => $totalUsage,
                        'status'        => 'APPROVED',
                        'submitted_at'  => now(),
                        'org_id'        => $masterMeter->org_id,
                        'submitted_by_user_id' => $firstReading->approved_by_user_id
                            ?? $firstReading->submitted_by_user_id,
                    ]
                );

                // Sync master meter's base_reading to latest approved value
                $latestMaster = $masterMeter->latestApprovedReading;
                if ($latestMaster) {
                    $masterMeter->update(['base_reading' => $latestMaster->reading_value]);
                }
            });
        } catch (LockTimeoutException $e) {
            Log::warning("PerformBatchMasterAggregation: lock timeout for master meter {$masterMeter->id}, period {$periodEndStr}");
            throw $e;
        } finally {
            $lock->release();
        }
    }
}
