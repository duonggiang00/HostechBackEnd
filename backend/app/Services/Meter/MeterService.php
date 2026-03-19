<?php

namespace App\Services\Meter;

use App\Models\Meter\Meter;
use App\Models\Property\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class MeterService
{
    /**
     * Get paginated meters with optional filtering and eager loading.
     */
    public function paginate(array $filters = [], int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        $query = QueryBuilder::for(Meter::class)
            ->allowedFilters([
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
            ])
            ->allowedSorts(['installed_at', 'code', 'type', 'created_at'])
            ->defaultSort('-created_at')
            ->allowedIncludes(['room', 'room.property', 'room.floor']);
        
        // Apply manual filters if provided
        foreach ($filters as $key => $value) {
            if ($key === 'property_id' && $value) {
                $query->whereHas('room', function (Builder $q) use ($value) {
                    $q->where('property_id', $value);
                });
            } elseif ($key === 'floor_id' && $value) {
                $query->whereHas('room', function (Builder $q) use ($value) {
                    $q->where('floor_id', $value);
                });
            } elseif ($key === 'type' && $value) {
                $query->where('type', $value);
            } elseif ($key === 'is_active' && $value !== '') {
                $query->where('is_active', (bool) $value);
            } elseif ($key === 'room_id' && $value) {
                $query->where('room_id', $value);
            }
        }

        $user = request()->user();
        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('room.contracts', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
                    ->whereHas('members', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id)
                            ->where('status', 'APPROVED');
                    });
            });
        } elseif ($user && $user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('room.property.managers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
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
     * Get meter statistics including latest readings.
     */
    public function getStatistics(array $filters = [], ?string $propertyId = null): array
    {
        $query = Meter::query();
        
        // Apply filters
        foreach ($filters as $key => $value) {
            if ($key === 'property_id' && $value) {
                $query->whereHas('room', function (Builder $q) use ($value) {
                    $q->where('property_id', $value);
                });
            } elseif ($key === 'floor_id' && $value) {
                $query->whereHas('room', function (Builder $q) use ($value) {
                    $q->where('floor_id', $value);
                });
            } elseif ($key === 'type' && $value) {
                $query->where('type', $value);
            } elseif ($key === 'is_active' && $value !== '') {
                $query->where('is_active', (bool) $value);
            }
        }
        
        // Apply property_id if provided
        if ($propertyId) {
            $query->whereHas('room', function (Builder $q) use ($propertyId) {
                $q->where('property_id', $propertyId);
            });
        }
        
        $meters = $query->with('latestReading')->get();
        
        $totalElectric = 0;
        $totalWater = 0;
        
        foreach ($meters as $meter) {
            if ($meter->latestReading && $meter->latestReading->reading_value) {
                if ($meter->type === 'ELECTRIC') {
                    $totalElectric += $meter->latestReading->reading_value;
                } else {
                    $totalWater += $meter->latestReading->reading_value;
                }
            }
        }
        
        return [
            'total_meters' => $meters->count(),
            'active_meters' => $meters->where('is_active', true)->count(),
            'master_meters' => $meters->where('is_master', true)->count(),
            'electric_meters' => $meters->where('type', 'ELECTRIC')->count(),
            'water_meters' => $meters->where('type', 'WATER')->count(),
            'total_electric_reading' => $totalElectric,
            'total_water_reading' => $totalWater,
        ];
    }

    /**
     * Create a new meter.
     */
    public function create(array $data): Meter
    {
        $user = request()->user();

        if ($user && ! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } elseif (! isset($data['org_id']) && isset($data['room_id'])) {
            $room = Room::find($data['room_id']);
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

    /**
     * Attach a meter to a specific room.
     */
    public function attachToRoom(Meter $meter, Room $room): Meter
    {
        $meter->update([
            'room_id' => $room->id,
            'property_id' => $room->property_id,
            'is_master' => false,
        ]);
        
        return $meter;
    }

    /**
     * Detach a meter from its current room.
     */
    public function detachFromRoom(Meter $meter): Meter
    {
        $meter->update(['room_id' => null]);
        
        return $meter;
    }

    /**
     * Set/Unset a meter as a Master Meter for a property.
     */
    public function setAsMaster(Meter $meter, bool $isMaster = true): Meter
    {
        // If setting as master, ensure no other master meter of same type exists for this property
        if ($isMaster) {
            Meter::where('property_id', $meter->property_id)
                ->where('type', $meter->type)
                ->where('is_master', true)
                ->where('id', '!=', $meter->id)
                ->update(['is_master' => false]);
            
            $meter->update(['is_master' => true, 'room_id' => null]);
        } else {
            $meter->update(['is_master' => false]);
        }

        return $meter;
    }

    /**
     * Switch master meter and exchange base/reading values.
     * Rule: The new master meter inherits the "running total" of the old one as its base_reading.
     */
    public function switchMasterMeter(Meter $oldMaster, Meter $newMaster): bool
    {
        if ($oldMaster->property_id !== $newMaster->property_id || $oldMaster->type !== $newMaster->type) {
            return false;
        }

        \DB::transaction(function () use ($oldMaster, $newMaster) {
            $latestReadingValue = $oldMaster->latestReading?->reading_value ?? $oldMaster->base_reading;

            // Mark old as not master
            $oldMaster->update(['is_master' => false]);

            // Set new as master and transfer the cumulative value to its base_reading
            $newMaster->update([
                'is_master' => true,
                'room_id' => null,
                'base_reading' => $latestReadingValue,
            ]);
        });

        return true;
    }
    /**
     * Reset all base readings to 0 for a given organization and optionally a specific property.
     */
    public function resetBaseReadings(string $orgId, ?string $propertyId = null): int
    {
        $query = Meter::where('org_id', $orgId);

        if ($propertyId) {
            $query->where('property_id', $propertyId);
        }

        return $query->update(['base_reading' => 0]);
    }
}
