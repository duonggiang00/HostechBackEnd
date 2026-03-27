<?php

namespace App\Services\Meter;

use App\Models\Meter\MeterReading;
use App\Models\System\TemporaryUpload;
use App\Services\Notification\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MeterReadingService
{
    public function __construct(
        protected NotificationService $notificationService,
    ) {}
    /**
     * Get paginated meter readings with optional filtering.
     */
    public function paginate(array $filters = [], int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = QueryBuilder::for(MeterReading::class)
            ->allowedFilters(array_merge($filters, [
                AllowedFilter::exact('status'),
                AllowedFilter::exact('meter_id'),
                AllowedFilter::exact('submitted_by_user_id'),
                AllowedFilter::exact('approved_by_user_id'),
            ]))
            ->allowedSorts(['period_start', 'period_end', 'reading_value', 'created_at'])
            ->defaultSort('-created_at')
            ->allowedIncludes(['meter', 'submittedBy', 'approvedBy']);

        $user = request()->user();
        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('meter.room.contracts', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
                    ->whereHas('members', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id)
                            ->where('status', 'APPROVED');
                    });
            });
        } elseif ($user && $user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('meter.room.property.managers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if ($search) {
            // Có thể thêm logic tìm kiếm mở rộng (tìm theo user name...)
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Create a new meter reading.
     */
    public function create(array $data): MeterReading
    {
        return DB::transaction(function () use ($data) {
            $meterId = $data['meter_id'];
            $readingValue = $data['reading_value'];

            // Get previous approved reading
            $prev = MeterReading::where('meter_id', $meterId)
                ->where('status', 'APPROVED')
                ->orderBy('period_end', 'desc')
                ->first();

            $meter = \App\Models\Meter\Meter::find($meterId);
            $prevValue = $prev ? $prev->reading_value : ($meter ? $meter->base_reading : 0);
            
            // Validation: Reading cannot be smaller than previous
            if ($readingValue < $prevValue) {
                throw new \Exception("Chỉ số mới ($readingValue) không thể nhỏ hơn chỉ số cũ ($prevValue)");
            }

            // Preservation of initial reading for history integrity
            if (!$prev && $meter && !isset($meter->meta['initial_reading'])) {
                $meta = $meter->meta ?? [];
                $meta['initial_reading'] = $meter->base_reading;
                $meter->update(['meta' => $meta]);
            }

            $reading = MeterReading::create($data);
            
            // Centralize consumption calculation
            $this->recalculateConsumption($reading);

            // Sync base reading if approved
            if ($reading->status === 'APPROVED') {
                $this->syncMeterBaseReading($reading->meter);
                $this->aggregateToMaster($reading);
            }

            $this->attachProofs($reading, $data['proof_media_ids'] ?? []);

            // Dispatch notification after successful creation
            $this->notificationService->notifyMeterReadingStatusChanged($reading, $reading->status);

            return $reading->fresh(['meter', 'submittedBy', 'approvedBy']);
        });
    }

    /**
     * Bulk create meter readings.
     */
    public function bulkStore(array $readings): array
    {
        return DB::transaction(function () use ($readings) {
            $results = [];
            foreach ($readings as $readingData) {
                $results[] = $this->create($readingData);
            }
            return $results;
        });
    }

    /**
     * Update an existing meter reading.
     */
    public function update(MeterReading $reading, array $data): MeterReading
    {
        return DB::transaction(function () use ($reading, $data) {
            $isBecameApproved = isset($data['status']) && $data['status'] === 'APPROVED' && $reading->status !== 'APPROVED';

            if ($isBecameApproved) {
                $data['approved_at'] = now();
                $data['approved_by_user_id'] = auth()->id();
            }

            $reading->update($data);
            
            // Centralize consumption calculation
            $this->recalculateConsumption($reading);
            
            // If we are updating in the middle of history, we might need to cascade
            $this->triggerCascadeRecalculation($reading->meter, $reading->period_end);

            // Sync base reading and aggregate if approved
            if ($reading->status === 'APPROVED') {
                $this->syncMeterBaseReading($reading->meter);
                
                // Aggregate to master if status just became approved OR if values changed on an already approved reading
                $isValueChanged = isset($data['reading_value']) || isset($data['consumption']);
                if ($isBecameApproved || $isValueChanged) {
                    $this->aggregateToMaster($reading);
                }
            }

            if (isset($data['proof_media_ids'])) {
                $this->attachProofs($reading, $data['proof_media_ids']);
            }

            if (isset($data['status'])) {
                event(new \App\Events\Meter\MeterReadingStatusChanged($reading->load('meter')));

                // Dispatch persistent + broadcast notifications
                $this->notificationService->notifyMeterReadingStatusChanged(
                    $reading,
                    $data['status'],
                    $data['rejection_reason'] ?? null
                );
            }

            return $reading->fresh(['meter', 'submittedBy', 'approvedBy']);
        });
    }

    /**
     * Automatically aggregate room readings to the master meter for the property.
     */
    public function aggregateToMaster(MeterReading $reading)
    {
        $meter = $reading->meter;

        // Skip if already a master meter or if no property link
        if ($meter->is_master || !$meter->property_id) {
            return null;
        }

        // Find the master meter for this property and service type
        $masterMeter = \App\Models\Meter\Meter::where('property_id', $meter->property_id)
            ->where('service_id', $meter->service_id)
            ->where('is_master', true)
            ->first();

        if (!$masterMeter) {
            return null;
        }

        $periodStart = $reading->period_start;
        $periodEnd = $reading->period_end;

        // Sum up the consumption for all room meters for the given period
        $totalPropertyUsage = MeterReading::whereHas('meter', function ($query) use ($masterMeter) {
                $query->where('property_id', $masterMeter->property_id)
                    ->where('service_id', $masterMeter->service_id)
                    ->where('is_master', false);
            })
            ->where('period_start', $periodStart)
            ->where('period_end', $periodEnd)
            ->where('status', 'APPROVED')
            ->sum('consumption');

        // Preservation of initial reading for master meter history integrity
        if (!isset($masterMeter->meta['initial_reading'])) {
            $meta = $masterMeter->meta ?? [];
            $meta['initial_reading'] = $masterMeter->base_reading;
            $masterMeter->update(['meta' => $meta]);
        }

        // Ensure Master Meter reading is CUMULATIVE
        $prevMaster = MeterReading::where('meter_id', $masterMeter->id)
            ->where('period_end', '<=', $periodStart)
            ->where('status', 'APPROVED')
            ->orderBy('period_end', 'desc')
            ->first();

        // Use meta['initial_reading'] as stable anchor, fallback to master base_reading
        $initialMasterStart = $masterMeter->meta['initial_reading'] ?? $masterMeter->base_reading;
        $prevValue = $prevMaster ? $prevMaster->reading_value : $initialMasterStart;
        $readingValue = $prevValue + $totalPropertyUsage;

        $masterReading = MeterReading::updateOrCreate(
            [
                'meter_id' => $masterMeter->id,
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
            ],
            [
                'reading_value' => $readingValue,
                'consumption' => $totalPropertyUsage,
                'status' => 'APPROVED',
                'submitted_at' => now(),
                'org_id' => $masterMeter->org_id,
                'submitted_by_user_id' => auth()->id(),
            ]
        );

        // Sync the source room meter's base reading
        $this->syncMeterBaseReading($meter);

        // Sync master meter's base reading too
        $this->syncMeterBaseReading($masterMeter);

        return $masterReading;
    }

    /**
     * Recalculate consumption for a specific reading based on the previous one.
     */
    public function recalculateConsumption(MeterReading $reading): void
    {
        $prev = MeterReading::where('meter_id', $reading->meter_id)
            ->where('id', '!=', $reading->id)
            ->where('period_end', '<=', $reading->period_start)
            ->where('status', 'APPROVED')
            ->orderBy('period_end', 'desc')
            ->first();

        // Use meta['initial_reading'] as stable anchor, fallback to meter->base_reading
        $initialReading = $reading->meter->meta['initial_reading'] ?? $reading->meter->base_reading;
        $prevValue = $prev ? $prev->reading_value : ($reading->meter ? $initialReading : 0);
        
        $reading->update([
            'consumption' => $reading->reading_value - $prevValue
        ]);
    }

    /**
     * Synchronize the meter's base_reading with its latest approved reading.
     * Also synchronizes the master meter's base_reading effectively.
     */
    public function syncMeterBaseReading(\App\Models\Meter\Meter $meter): void
    {
        // 1. Update the meter's own base_reading to its latest approved reading
        $latest = $meter->latestApprovedReading;
        if ($latest) {
            $meter->update(['base_reading' => $latest->reading_value]);
        }

        // 2. If it's a room meter, also ensure the master meter's base_reading is current
        if (!$meter->is_master) {
            $masterMeter = \App\Models\Meter\Meter::where('property_id', $meter->property_id)
                ->where('service_id', $meter->service_id)
                ->where('is_master', true)
                ->first();

            if ($masterMeter) {
                $latestMaster = $masterMeter->latestApprovedReading;
                if ($latestMaster) {
                    $masterMeter->update(['base_reading' => $latestMaster->reading_value]);
                }
            }
        }
    }

    /**
     * Trigger a cascade recalculation for all subsequent readings.
     * Needed when a historical reading value changes.
     */
    public function triggerCascadeRecalculation(\App\Models\Meter\Meter $meter, \Carbon\Carbon|string $startDate): void
    {
        $subsequentReadings = MeterReading::where('meter_id', $meter->id)
            ->where('period_start', '>=', $startDate)
            ->where('status', 'APPROVED')
            ->orderBy('period_start', 'asc')
            ->get();

        foreach ($subsequentReadings as $reading) {
            $this->recalculateConsumption($reading);
            // Also need to update the master aggregation for each affected period
            $this->aggregateToMaster($reading);
        }
    }

    protected function attachProofs(MeterReading $reading, array $mediaIds)
    {
        if (empty($mediaIds)) {
            return;
        }

        $temporaryUploads = TemporaryUpload::whereIn('id', $mediaIds)->get();

        foreach ($temporaryUploads as $tempUpload) {
            $mediaPath = storage_path('app/'.$tempUpload->file_path);

            if (file_exists($mediaPath)) {
                $reading->addMedia($mediaPath)
                    ->preservingOriginal()
                    ->toMediaCollection('reading_proofs');
            }
        }
    }

    /**
     * Delete a meter reading.
     *
     * @return bool|null
     */
    public function delete(MeterReading $reading)
    {
        return $reading->delete();
    }
}
