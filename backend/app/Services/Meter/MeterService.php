<?php

namespace App\Services\Meter;

use App\Models\Meter\Meter;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MeterService
{
    /**
     * Get paginated meters with optional filtering and eager loading.
     *
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function paginate(array $filters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Meter::class)
            ->allowedFilters(array_merge($filters, [
                AllowedFilter::exact('type'),
                AllowedFilter::exact('is_active'),
                AllowedFilter::exact('room_id'),
                // Custom filter for fetching all meters belonging to a property
                AllowedFilter::callback('property_id', function (Builder $query, $value) {
                    $query->whereHas('room', function (Builder $q) use ($value) {
                        $q->where('property_id', $value);
                    });
                }),
                // Custom filter for fetching all meters belonging to a floor
                AllowedFilter::callback('floor_id', function (Builder $query, $value) {
                    $query->whereHas('room', function (Builder $q) use ($value) {
                        $q->where('floor_id', $value);
                    });
                }),
            ]))
            ->allowedSorts(['installed_at', 'code', 'type', 'created_at'])
            ->defaultSort('-created_at')
            ->allowedIncludes(['room', 'room.property', 'room.floor']);

        $user = request()->user();
        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('room.contracts', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
                    ->whereHas('members', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id)
                            ->where('status', 'APPROVED');
                    });
            });
        }

        if ($search) {
            $query->where(function (Builder $q) use ($search) {
                $q->where('code', 'LIKE', "%{$search}%")
                    ->orWhereHas('room', function (Builder $qRoom) use ($search) {
                        $qRoom->where('name', 'LIKE', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Create a new meter.
     */
    public function create(array $data): Meter
    {
        $user = request()->user();
        
        if ($user && ! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } elseif (!isset($data['org_id']) && isset($data['room_id'])) {
            $room = \App\Models\Property\Room::find($data['room_id']);
            $data['org_id'] = $room?->org_id;
        }

        return Meter::create($data);
    }

    /**
     * Update an existing meter.
     */
    public function update(Meter $meter, array $data): Meter
    {
        $meter->update($data);

        return $meter;
    }

    /**
     * Soft delete a meter.
     *
     * @return bool|null
     */
    public function delete(Meter $meter)
    {
        return $meter->delete();
    }
}
