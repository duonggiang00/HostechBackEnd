<?php

namespace App\Listeners\Meter;

use App\Events\Meter\MeterReadingApproved;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PerformMasterAggregation implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(MeterReadingApproved $event): void
    {
        $reading = $event->reading;
        $meter = $reading->meter;

        // Skip if already a master meter or if no property link
        if ($meter->is_master || !$meter->property_id) {
            return;
        }

        // Find the master meter for this property and meter type
        $masterMeter = Meter::where('property_id', $meter->property_id)
            ->where('type', $meter->type)
            ->where('is_master', true)
            ->first();

        if (!$masterMeter) {
            return;
        }

        $periodStart = $reading->period_start;
        $periodEnd = $reading->period_end;

        // Normalize date format for lock key and queries to avoid mismatches
        $periodStartStr = $periodStart->format('Y-m-d');
        $periodEndStr = $periodEnd->format('Y-m-d');

        // Use a distributed lock to prevent race conditions when updating the master meter
        $lockKey = "aggregation_lock_{$masterMeter->id}_{$periodEndStr}";
        $lock = Cache::lock($lockKey, 30); // 30 seconds ttl

        try {
            // Block for up to 10 seconds if another worker is already aggregating
            $lock->block(10);

            DB::transaction(function () use ($masterMeter, $periodStartStr, $periodEndStr, $reading) {
                // Sum up the consumption for all room meters for the given period
                $totalPropertyUsage = MeterReading::whereHas('meter', function ($query) use ($masterMeter) {
                        $query->where('property_id', $masterMeter->property_id)
                            ->where('type', $masterMeter->type)
                            ->where('is_master', false);
                    })
                    ->whereDate('period_start', $periodStartStr)
                    ->whereDate('period_end', $periodEndStr)
                    ->where('status', 'APPROVED')
                    ->sum('consumption');

                // Ensure Master Meter has initial reading anchor
                if (!isset($masterMeter->meta['initial_reading'])) {
                    $meta = $masterMeter->meta ?? [];
                    $meta['initial_reading'] = $masterMeter->base_reading;
                    $masterMeter->update(['meta' => $meta]);
                }

                // Get previous master reading
                $prevMaster = MeterReading::where('meter_id', $masterMeter->id)
                    ->whereDate('period_end', '<=', $periodStartStr)
                    ->where('status', 'APPROVED')
                    ->orderBy('period_end', 'desc')
                    ->first();

                $initialMasterStart = $masterMeter->meta['initial_reading'] ?? $masterMeter->base_reading;
                $prevValue = $prevMaster ? $prevMaster->reading_value : $initialMasterStart;
                $readingValue = $prevValue + $totalPropertyUsage;

                // Re-fetch within transaction to minimize updateOrCreate race
                MeterReading::updateOrCreate(
                    [
                        'meter_id' => $masterMeter->id,
                        'period_start' => $periodStartStr,
                        'period_end' => $periodEndStr,
                    ],
                    [
                        'reading_value' => $readingValue,
                        'consumption' => $totalPropertyUsage,
                        'status' => 'APPROVED',
                        'submitted_at' => now(),
                        'org_id' => $masterMeter->org_id,
                        'submitted_by_user_id' => $reading->approved_by_user_id ?? $reading->submitted_by_user_id,
                    ]
                );

                // Sync master meter's base_reading to the latest value
                $latestMaster = $masterMeter->latestApprovedReading;
                if ($latestMaster) {
                    $masterMeter->update(['base_reading' => $latestMaster->reading_value]);
                }
            });
        } catch (LockTimeoutException $e) {
            // If lock cannot be acquired after 10s, fail and let the queue retry
            throw $e;
        } finally {
            $lock->release();
        }
    }
}
