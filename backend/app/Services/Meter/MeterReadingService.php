<?php

namespace App\Services\Meter;

use App\Models\Meter\MeterReading;
use App\Models\System\TemporaryUpload;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MeterReadingService
{
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
        $data['status'] = $data['status'] ?? 'PENDING';
        $data['submitted_at'] = now();
        $data['submitted_by_user_id'] = auth()->id();

        $reading = MeterReading::create($data);

        $this->attachProofs($reading, $data['proof_media_ids'] ?? []);

        return $reading;
    }

    /**
     * Update an existing meter reading.
     */
    public function update(MeterReading $reading, array $data): MeterReading
    {
        $isBecameApproved = isset($data['status']) && $data['status'] === 'APPROVED' && $reading->status !== 'APPROVED';

        if ($isBecameApproved) {
            $data['approved_at'] = now();
            $data['approved_by_user_id'] = auth()->id();
        }

        $reading->update($data);

        if ($isBecameApproved) {
            $this->aggregateToMaster($reading);
        }

        if (isset($data['proof_media_ids'])) {
            $this->attachProofs($reading, $data['proof_media_ids']);
        }

        return $reading;
    }

    /**
     * Automatically aggregate room readings to the master meter for the property.
     */
    public function aggregateToMaster(MeterReading $reading)
    {
        $meter = $reading->meter;

        // Skip if already a master meter or if no property link (should not happen for room meters)
        if ($meter->is_master || !$meter->property_id) {
            return;
        }

        // Find the master meter for this property and service type
        $masterMeter = \App\Models\Meter\Meter::where('property_id', $meter->property_id)
            ->where('service_id', $meter->service_id)
            ->where('is_master', true)
            ->first();

        if (!$masterMeter) {
            return;
        }

        // Recalculate total usage for this period from all room meters
        // Usage = ReadingValue - (PreviousReadingValue OR BaseReading)
        $totalPropertyUsage = \App\Models\Meter\MeterReading::whereHas('meter', function ($query) use ($masterMeter) {
            $query->where('property_id', $masterMeter->property_id)
                ->where('type', $masterMeter->type)
                ->where('is_master', false);
        })
            ->where('period_start', $reading->period_start)
            ->where('period_end', $reading->period_end)
            ->where('status', 'APPROVED')
            ->get()
            ->sum(function ($r) {
                $prev = \App\Models\Meter\MeterReading::where('meter_id', $r->meter_id)
                    ->where('period_end', '<', $r->period_start)
                    ->where('status', 'APPROVED')
                    ->orderBy('period_end', 'desc')
                    ->first();
                
                $prevValue = $prev ? $prev->reading_value : $r->meter->base_reading;
                $usage = max(0, $r->reading_value - $prevValue);
                return $usage;
            });

        // Update/Create the master reading for this period
        if ($totalPropertyUsage > 0 || \App\Models\Meter\MeterReading::where('meter_id', $masterMeter->id)
            ->where('period_start', $reading->period_start)
            ->where('period_end', $reading->period_end)
            ->exists()) {
            
            \App\Models\Meter\MeterReading::updateOrCreate([
                'meter_id' => $masterMeter->id,
                'period_start' => $reading->period_start,
                'period_end' => $reading->period_end,
                'org_id' => $reading->org_id,
            ], [
                'reading_value' => $masterMeter->base_reading + $totalPropertyUsage,
                'status' => 'APPROVED',
                'approved_at' => now(),
                'approved_by_user_id' => auth()->id(),
            ]);
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
