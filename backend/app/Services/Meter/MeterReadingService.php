<?php

namespace App\Services\Meter;

use App\Models\Meter\MeterReading;
use App\Models\System\TemporaryUpload;
use App\Services\Notification\NotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('meter_id'),
                AllowedFilter::exact('submitted_by_user_id'),
                AllowedFilter::exact('approved_by_user_id'),
            ])
            ->allowedSorts(['period_start', 'period_end', 'reading_value', 'created_at'])
            ->defaultSort('-created_at')
            ->allowedIncludes(['meter', 'meter.room', 'submittedBy', 'approvedBy', 'media']);

        // Force filters passed from controller (e.g. lock index by meter_id).
        if (! empty($filters['meter_id'])) {
            $query->where('meter_id', $filters['meter_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['submitted_by_user_id'])) {
            $query->where('submitted_by_user_id', $filters['submitted_by_user_id']);
        }

        if (! empty($filters['approved_by_user_id'])) {
            $query->where('approved_by_user_id', $filters['approved_by_user_id']);
        }

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
            $actorId = Auth::id();
            $data['org_id'] = $data['org_id'] ?? Auth::user()?->org_id;
            $meterId = $data['meter_id'];
            $readingValue = $data['reading_value'];
            $status = $data['status'] ?? 'DRAFT';

            $data['status'] = $status;
            $data['submitted_by_user_id'] = $data['submitted_by_user_id'] ?? $actorId;

            if ($status === 'SUBMITTED' || $status === 'APPROVED') {
                $data['submitted_at'] = $data['submitted_at'] ?? now();
            }

            if ($status === 'APPROVED') {
                $data['approved_at'] = $data['approved_at'] ?? now();
                $data['approved_by_user_id'] = $data['approved_by_user_id'] ?? $actorId;
            }

            // Keep one record per meter-period. If a soft-deleted row exists, remove it first.
            $existing = MeterReading::withTrashed()->where('meter_id', $meterId)
                ->where('period_start', $data['period_start'])
                ->where('period_end', $data['period_end'])
                ->first();

            if ($existing && $existing->trashed()) {
                $existing->forceDelete();
                $existing = null;
            }

            if ($existing) {
                if ($existing->status !== 'DRAFT') {
                    throw ValidationException::withMessages([
                        'period_start' => 'Đã tồn tại bản chốt số cho kỳ này và không còn ở trạng thái DRAFT.',
                    ]);
                }

                return $this->update($existing, $data);
            }

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

            try {
                $reading = MeterReading::create($data);
            } catch (UniqueConstraintViolationException $e) {
                $duplicate = MeterReading::where('meter_id', $meterId)
                    ->where('period_start', $data['period_start'])
                    ->where('period_end', $data['period_end'])
                    ->first();

                if ($duplicate && $duplicate->status === 'DRAFT') {
                    return $this->update($duplicate, $data);
                }

                throw ValidationException::withMessages([
                    'period_start' => 'Đã tồn tại bản chốt số cho kỳ này.',
                ]);
            }
            
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

            // Fresh reload để đảm bảo getMedia() lấy proofs mới nhất từ DB (không dùng 'media' relationship)
            return $reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']);
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
            $originalStatus = $reading->status;
            $targetStatus = $data['status'] ?? $originalStatus;

            $this->assertValidTransition($originalStatus, $targetStatus);
            $this->enrichStatusAuditFields($data, $targetStatus, $originalStatus);

            $isBecameApproved = $targetStatus === 'APPROVED' && $originalStatus !== 'APPROVED';
            $isReadingValueChanged = isset($data['reading_value']) || isset($data['period_start']) || isset($data['period_end']);

            $reading->update($data);
            
            // Recalculate only when value/date changed or when status moves into APPROVED.
            if ($isReadingValueChanged || $isBecameApproved) {
                $this->recalculateConsumption($reading);
            }
            
            // If we are updating in the middle of history, we might need to cascade
            if ($isReadingValueChanged) {
                $this->triggerCascadeRecalculation($reading->meter, $reading->period_end);
            }

            // Sync base reading and aggregate if approved
            if ($reading->status === 'APPROVED') {
                $this->syncMeterBaseReading($reading->meter);
                
                // Aggregate to master if status just became approved OR if values changed on an already approved reading
                $isValueChanged = $isReadingValueChanged || isset($data['consumption']);
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
                    $this->resolveRejectionReason($data)
                );
            }

            // Fresh reload để đảm bảo getMedia() lấy proofs mới nhất từ DB (không dùng 'media' relationship)
            return $reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']);
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
                'submitted_by_user_id' => Auth::id(),
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
            \Log::debug('📸 No proof media IDs to attach - clearing existing proofs to allow deletion');
            $reading->clearMediaCollection('reading_proofs');
            return;
        }

        $temporaryUploads = TemporaryUpload::whereIn('id', $mediaIds)->get();
        \Log::debug("📸 Found {$temporaryUploads->count()} temporary uploads for reading {$reading->id}");

        foreach ($temporaryUploads as $tempUpload) {
            $tempMedias = $tempUpload->media; // Fix: get all media regardless of collection name
            \Log::debug("📸 Temp upload {$tempUpload->id} has {$tempMedias->count()} media items");

            foreach ($tempMedias as $tempMedia) {
                $relativePath = $tempMedia->getPathRelativeToRoot();

                if (! $relativePath) {
                    \Log::warning("📸 No relative path for media {$tempMedia->id}");
                    continue;
                }

                $reading->addMediaFromDisk($relativePath, $tempMedia->disk)
                    ->usingFileName($tempMedia->file_name)
                    ->toMediaCollection('reading_proofs');
                    
                \Log::debug("📸 Attached media {$tempMedia->file_name} to reading {$reading->id}");
            }
        }
        
        // Verify attachment
        $proofs = $reading->getMedia('reading_proofs');
        \Log::debug("📸 After attachment, reading {$reading->id} has {$proofs->count()} proofs");
    }

    protected function assertValidTransition(string $fromStatus, string $toStatus): void
    {
        $allowed = [
            'DRAFT' => ['DRAFT', 'SUBMITTED'],
            'SUBMITTED' => ['SUBMITTED', 'APPROVED', 'REJECTED'],
            'REJECTED' => ['REJECTED', 'DRAFT', 'SUBMITTED'],
            // Keep correction flow for approved records (same status with value fix).
            'APPROVED' => ['APPROVED'],
            'LOCKED' => ['LOCKED'],
        ];

        $transitions = $allowed[$fromStatus] ?? [];
        if (! in_array($toStatus, $transitions, true)) {
            throw ValidationException::withMessages([
                'status' => "Không thể chuyển trạng thái từ {$fromStatus} sang {$toStatus}",
            ]);
        }
    }

    protected function enrichStatusAuditFields(array &$data, string $targetStatus, string $originalStatus): void
    {
        $actorId = Auth::id();

        if ($targetStatus === 'SUBMITTED' && $originalStatus !== 'SUBMITTED') {
            $data['submitted_at'] = $data['submitted_at'] ?? now();
            $data['submitted_by_user_id'] = $data['submitted_by_user_id'] ?? $actorId;
        }

        if ($targetStatus === 'APPROVED' && $originalStatus !== 'APPROVED') {
            $data['approved_at'] = now();
            $data['approved_by_user_id'] = $actorId;
        }
    }

    protected function resolveRejectionReason(array $data): ?string
    {
        if (! empty($data['rejection_reason'])) {
            return $data['rejection_reason'];
        }

        if (! empty($data['meta']['rejection_reason'])) {
            return $data['meta']['rejection_reason'];
        }

        return null;
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
