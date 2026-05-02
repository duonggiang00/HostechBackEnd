<?php

namespace App\Services\Meter;

use App\Events\Meter\BulkMeterReadingsApproved;
use App\Events\Meter\MeterReadingApproved;
use App\Events\Meter\MeterReadingStatusChanged;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\System\TemporaryUpload;
use App\Services\Notification\NotificationService;
use Carbon\Carbon;
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
                AllowedFilter::callback('property_id', function ($query, $value) {
                    $query->whereHas('meter', function ($q) use ($value) {
                        $q->where('property_id', $value);
                    });
                }),
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

            // DRAFT visibility: Manager/Owner chỉ thấy SUBMITTED trở lên.
            // Staff chỉ thấy DRAFT của chính mình.
            if ($user->hasRole(['Manager', 'Owner'])) {
                $query->where('status', '!=', 'DRAFT');
            } elseif ($user->hasRole('Staff')) {
                $query->where(function ($q) use ($user) {
                    $q->where('status', '!=', 'DRAFT')
                        ->orWhere('submitted_by_user_id', $user->id);
                });
            }
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
            // Manager/Owner tạo chỉ số → tự động APPROVED (không cần rà soát).
            // Staff tạo → DRAFT (cần rà soát trước khi gửi duyệt).
            $actor = Auth::user();
            $defaultStatus = ($actor && $actor->hasRole(['Manager', 'Owner'])) ? 'APPROVED' : 'DRAFT';
            $status = $data['status'] ?? $defaultStatus;

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
            $pStart = $data['period_start'] ?? null;
            $pEnd = $data['period_end'] ?? null;

            $existing = null;
            if ($pStart && $pEnd) {
                $existing = MeterReading::withTrashed()->where('meter_id', $meterId)
                    ->where('period_start', $pStart)
                    ->where('period_end', $pEnd)
                    ->first();
            }

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

            // Mốc chỉ số không được thấp hơn: gồm cả SUBMITTED (chờ duyệt) để cho phép kỳ sau
            $prev = MeterReading::where('meter_id', $meterId)
                ->sealedOrSubmitted()
                ->orderBy('period_end', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $meter = Meter::find($meterId);
            $prevValue = $prev ? $prev->reading_value : ($meter ? $meter->base_reading : 0);

            // Validation: Reading cannot be smaller than previous
            if ($readingValue < $prevValue) {
                throw new \Exception("Chỉ số mới ($readingValue) không thể nhỏ hơn chỉ số cũ ($prevValue)");
            }

            // Preservation of initial reading for history integrity
            if (! $prev && $meter && ! isset($meter->meta['initial_reading'])) {
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

            // Consumption calculation and events are now handled by MeterReadingObserver

            $this->attachProofs($reading, $data['proof_media_ids'] ?? []);

            // Fresh reload để đảm bảo getMedia() lấy proofs mới nhất từ DB
            return $reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']);
        });
    }

    /**
     * Create a meter reading WITHOUT dispatching events.
     * Used internally by bulkStore() so events can be batched after all records are persisted.
     */
    protected function createSilent(array $data): MeterReading
    {
        return DB::transaction(function () use ($data) {
            $actorId = Auth::id();
            $data['org_id'] = $data['org_id'] ?? Auth::user()?->org_id;
            $meterId = $data['meter_id'];
            $readingValue = $data['reading_value'];

            $actor = Auth::user();
            $defaultStatus = ($actor && $actor->hasRole(['Manager', 'Owner'])) ? 'APPROVED' : 'DRAFT';
            $status = $data['status'] ?? $defaultStatus;

            $data['status'] = $status;
            $data['submitted_by_user_id'] = $data['submitted_by_user_id'] ?? $actorId;

            if ($status === 'SUBMITTED' || $status === 'APPROVED') {
                $data['submitted_at'] = $data['submitted_at'] ?? now();
            }
            if ($status === 'APPROVED') {
                $data['approved_at'] = $data['approved_at'] ?? now();
                $data['approved_by_user_id'] = $data['approved_by_user_id'] ?? $actorId;
            }

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
                // Update silently (no event from update path)
                $existing->update($data);
                $this->recalculateConsumption($existing);
                $this->attachProofs($existing, $data['proof_media_ids'] ?? []);

                return $existing->fresh()->load(['meter', 'submittedBy', 'approvedBy']);
            }

            $prev = MeterReading::where('meter_id', $meterId)
                ->sealedOrSubmitted()
                ->orderBy('period_end', 'desc')
                ->orderBy('id', 'desc')
                ->first();

            $meter = Meter::find($meterId);
            $prevValue = $prev ? $prev->reading_value : ($meter ? $meter->base_reading : 0);

            if ($readingValue < $prevValue) {
                throw new \Exception("Chỉ số mới ($readingValue) không thể nhỏ hơn chỉ số cũ ($prevValue)");
            }

            if (! $prev && $meter && ! isset($meter->meta['initial_reading'])) {
                $meta = $meter->meta ?? [];
                $meta['initial_reading'] = $meter->base_reading;
                $meter->update(['meta' => $meta]);
            }

            $reading = MeterReading::withoutEvents(fn () => MeterReading::create($data));
            $this->attachProofs($reading, $data['proof_media_ids'] ?? []);

            return $reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']);
        });
    }

    /**
     * Bulk create meter readings.
     *
     * Optimization: instead of dispatching N individual events (one per reading),
     * we collect all approved IDs and fire ONE BulkMeterReadingsApproved event.
     * This reduces billing queue pressure from O(N) jobs to O(1) job.
     */
    public function bulkStore(array $readings): array
    {
        $results = [];
        $approvedIds = [];

        DB::transaction(function () use ($readings, &$results, &$approvedIds) {
            foreach ($readings as $readingData) {
                // createSilent: creates the reading WITHOUT firing any events
                $reading = $this->createSilent($readingData);
                $results[] = $reading;

                if ($reading->status === 'APPROVED') {
                    $approvedIds[] = $reading->id;
                }
            }
        });

        // Fire ONE batch event for all approved readings
        if (! empty($approvedIds)) {
            $propertyId = ! empty($results) ? $results[0]->meter->property_id : null;
            event(new BulkMeterReadingsApproved($approvedIds, $propertyId));
        }

        return $results;
    }

    /**
     * Bulk submit DRAFT readings (DRAFT → SUBMITTED).
     * Only the owning Staff can submit their own drafts.
     */
    public function bulkSubmit(array $readingIds): array
    {
        return DB::transaction(function () use ($readingIds) {
            $readings = MeterReading::whereIn('id', $readingIds)
                ->where('status', 'DRAFT')
                ->where('submitted_by_user_id', Auth::id())
                ->get();

            $results = [];
            foreach ($readings as $reading) {
                $results[] = $this->update($reading, ['status' => 'SUBMITTED']);
            }

            return $results;
        });
    }

    /**
     * Bulk approve readings (SUBMITTED → APPROVED).
     */
    public function bulkApprove(array $readingIds): array
    {
        return DB::transaction(function () use ($readingIds) {
            // 1. Single query — eager-load meter to avoid N+1 in consumption calc & cache invalidation.
            $readings = MeterReading::whereIn('id', $readingIds)
                ->where('status', 'SUBMITTED')
                ->with(['meter'])
                ->get();

            if ($readings->isEmpty()) {
                return [];
            }

            $approvedIds = [];
            $propertyId = null;
            $now = now();
            $actorId = Auth::id();

            // 2. Pre-load all previous finalized readings for all affected meters in ONE query
            //    so consumption calculation does not trigger N individual DB calls.
            $meterIds = $readings->pluck('meter_id')->unique()->values();

            $prevByMeter = MeterReading::whereIn('meter_id', $meterIds)
                ->whereNotIn('id', $readingIds)
                ->whereIn('status', MeterReading::FINALIZED_STATUSES)
                ->orderBy('period_end', 'desc')
                ->get()
                ->groupBy('meter_id');

            // 3. Bypass Eloquent Observer entirely for the bulk path:
            //    - Observer@saving  would run calculateConsumption() for each row (N+1 queries).
            //    - Observer@updated would fire MeterReadingApproved → SynchronizeMeterMetadata
            //      (synchronous, 2 queries per reading) for each row.
            //    We handle both concerns manually below.
            MeterReading::withoutEvents(function () use (
                $readings, $prevByMeter, $now, $actorId, &$approvedIds, &$propertyId
            ) {
                foreach ($readings as $reading) {
                    $meter = $reading->getRelation('meter');

                    // --- Consumption calculation (inline, no extra query) ---
                    $prevList = $prevByMeter->get($reading->meter_id, collect());
                    // Find the most-recent finalized reading strictly before this period.
                    $prev = $prevList->first(
                        fn ($r) => $r->period_end <= $reading->period_start
                    );
                    $initialReading = $meter?->meta['initial_reading'] ?? $meter?->base_reading ?? 0;
                    $prevValue = $prev ? $prev->reading_value : $initialReading;
                    $consumption = $reading->reading_value - $prevValue;

                    // updateQuietly → no Observer, no extra SELECT, one UPDATE per reading.
                    $reading->updateQuietly([
                        'status' => 'APPROVED',
                        'consumption' => $consumption,
                        'approved_at' => $now,
                        'approved_by_user_id' => $actorId,
                    ]);

                    $approvedIds[] = $reading->id;
                    if (! $propertyId) {
                        $propertyId = $meter?->property_id;
                    }
                }
            });

            // 4. Sync base_reading once per unique meter (replaces N SynchronizeMeterMetadata calls).
            $readings
                ->unique('meter_id')
                ->each(function ($reading) {
                    $meter = $reading->getRelation('meter');
                    if ($meter) {
                        $this->syncMeterBaseReading($meter);
                    }
                });

            // 5. Fire ONE bulk event → DispatchMeterNotifications queued, BulkMeterReadingsApproved broadcast.
            if (! empty($approvedIds)) {
                event(new BulkMeterReadingsApproved($approvedIds, $propertyId));
            }

            // 6. Return all results in a SINGLE batch load (replaces N fresh()->load() calls).
            return MeterReading::whereIn('id', $approvedIds)
                ->with(['meter', 'submittedBy', 'approvedBy'])
                ->get()
                ->all();
        });
    }

    /**
     * Bulk reject readings (SUBMITTED/DRAFT → REJECTED).
     */
    public function bulkReject(array $readingIds, ?string $reason = null): array
    {
        return DB::transaction(function () use ($readingIds, $reason) {
            $readings = MeterReading::whereIn('id', $readingIds)
                ->whereIn('status', ['SUBMITTED', 'DRAFT'])
                ->get();

            $results = [];
            foreach ($readings as $reading) {
                $results[] = $this->update($reading, [
                    'status' => 'REJECTED',
                    'meta' => array_merge($reading->meta ?? [], ['rejection_reason' => $reason]),
                ]);
            }

            return $results;
        });
    }

    /**
     * Bulk update readings (fix multiple drafts/rejected records at once).
     */
    public function bulkUpdate(array $updates): array
    {
        return DB::transaction(function () use ($updates) {
            $results = [];
            foreach ($updates as $updateData) {
                $id = $updateData['id'] ?? null;
                if (! $id) {
                    continue;
                }

                $reading = MeterReading::find($id);
                if (! $reading) {
                    continue;
                }

                // Strip ID from updates to avoid mass-assignment errors or unexpected behavior
                $data = $updateData;
                unset($data['id']);

                $results[] = $this->update($reading, $data);
            }

            return $results;
        });
    }

    /**
     * Update an existing meter reading.
     */
    public function update(MeterReading $reading, array $data, bool $dispatchEvents = true): MeterReading
    {
        return DB::transaction(function () use ($reading, $data, $dispatchEvents) {
            $originalStatus = $reading->status;
            $targetStatus = $data['status'] ?? $originalStatus;

            $this->assertValidTransition($originalStatus, $targetStatus);
            $this->enrichStatusAuditFields($data, $targetStatus, $originalStatus);

            $isBecameApproved = $targetStatus === 'APPROVED' && $originalStatus !== 'APPROVED';
            $lockedFromApproved = $targetStatus === 'LOCKED' && $originalStatus === 'APPROVED';
            $isReadingValueChanged = isset($data['reading_value']) || isset($data['period_start']) || isset($data['period_end']);

            $reading->update($data);

            // Consumption tính bởi MeterReadingObserver@saving (xử lý cả trường hợp status → APPROVED).
            // Nếu giá trị lịch sử thay đổi, cascade lại các kỳ sau.
            if ($isReadingValueChanged) {
                $this->triggerCascadeRecalculation($reading->meter, $reading->period_end);
            }

            // EDA: Dispatch events based on status transition or value change
            if ($dispatchEvents) {
                if ($reading->status === 'APPROVED') {
                    $isValueChanged = $isReadingValueChanged || isset($data['consumption']);
                    if ($isBecameApproved || $isValueChanged) {
                        event(new MeterReadingApproved($reading));
                    }
                } elseif (isset($data['status'])) {
                    // For SUBMITTED, REJECTED, etc.
                    event(new MeterReadingStatusChanged($reading->load('meter')));
                }
            }

            // Khóa kỳ không bắn MeterReadingApproved — vẫn đồng bộ base_reading theo chỉ số đã chốt
            if ($lockedFromApproved) {
                $meter = Meter::query()->find($reading->meter_id);
                if ($meter) {
                    $this->syncMeterBaseReading($meter);
                }
            }

            // Fresh reload để đảm bảo getMedia() lấy proofs mới nhất từ DB
            return $reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']);
        });
    }

    /**
     * Tính lại tiêu thụ cho một lần ghi chỉ số.
     *
     * Quy tắc:
     * - Tìm chỉ số đã chốt (APPROVED hoặc LOCKED) gần nhất trước thời điểm period_start.
     * - Nếu không có, dùng initial_reading (hoặc base_reading) của đồng hồ làm mốc.
     * - consumption = reading_value - prev_value
     * - Lưu trực tiếp vào DB bằng updateQuietly để tránh trigger lại Observer.
     */
    protected function recalculateConsumption(MeterReading $reading): void
    {
        $prev = MeterReading::where('meter_id', $reading->meter_id)
            ->where('id', '!=', $reading->id)
            ->where('period_end', '<=', $reading->period_start)
            ->sealedOrSubmitted()
            ->orderBy('period_end', 'desc')
            ->orderBy('id', 'desc')
            ->first();

        $meter = $reading->meter;
        $initialReading = $meter?->meta['initial_reading'] ?? $meter?->base_reading ?? 0;
        $prevValue = $prev ? $prev->reading_value : $initialReading;

        $consumption = $reading->reading_value - $prevValue;

        // Lưu trực tiếp, không dispatch events để tránh vòng lặp vô tận
        $reading->updateQuietly(['consumption' => $consumption]);

        // Cập nhật property trên model in-memory để caller dùng được ngay
        $reading->consumption = $consumption;
    }

    /**
     * Synchronize the meter's base_reading with its latest finalized reading (APPROVED or LOCKED).
     * Also synchronizes the master meter's base_reading effectively.
     */
    public function syncMeterBaseReading(Meter $meter): void
    {
        // 1. Update the meter's own base_reading to its latest finalized reading
        $latest = $meter->latestApprovedReading;
        if ($latest) {
            $meter->update(['base_reading' => $latest->reading_value]);
        }

        // 2. If it's a room meter, also ensure the master meter's base_reading is current
        if (! $meter->is_master) {
            $masterMeter = Meter::where('property_id', $meter->property_id)
                ->where('type', $meter->type)
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
     *
     * Optimization: instead of firing N individual MeterReadingApproved events,
     * we recalculate consumption for each and then fire ONE BulkMeterReadingsApproved.
     */
    public function triggerCascadeRecalculation(Meter $meter, Carbon|string $startDate): void
    {
        $subsequentReadings = MeterReading::where('meter_id', $meter->id)
            ->where('period_start', '>=', $startDate)
            ->finalized()
            ->orderBy('period_start', 'asc')
            ->get();

        if ($subsequentReadings->isEmpty()) {
            return;
        }

        $approvedIds = [];
        foreach ($subsequentReadings as $reading) {
            $this->recalculateConsumption($reading);
            $approvedIds[] = $reading->id;
        }

        // ONE batch event instead of N individual MeterReadingApproved events
        event(new BulkMeterReadingsApproved($approvedIds));
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
            'DRAFT' => ['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'],
            'SUBMITTED' => ['SUBMITTED', 'APPROVED', 'REJECTED'],
            'REJECTED' => ['REJECTED', 'DRAFT', 'SUBMITTED'],
            // Keep correction flow for approved records (same status with value fix).
            'APPROVED' => ['APPROVED', 'LOCKED'],
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

        if ($targetStatus === 'LOCKED' && $originalStatus !== 'LOCKED') {
            $data['locked_at'] = now();
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
