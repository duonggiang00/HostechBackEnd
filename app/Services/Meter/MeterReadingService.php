<?php

namespace App\Services\Meter;

use App\Models\Meter\MeterReading;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MeterReadingService
{
    /**
     * Get paginated meter readings with optional filtering.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginate(array $filters = [], int $perPage = 15, ?string $search = null)
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

        return MeterReading::create($data);
    }

    /**
     * Update an existing meter reading.
     */
    public function update(MeterReading $reading, array $data): MeterReading
    {
        if (isset($data['status']) && $data['status'] === 'APPROVED' && $reading->status !== 'APPROVED') {
            $data['approved_at'] = now();
            $data['approved_by_user_id'] = auth()->id();
        }

        $reading->update($data);

        return $reading;
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
