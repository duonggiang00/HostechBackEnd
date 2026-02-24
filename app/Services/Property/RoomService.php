<?php

namespace App\Services\Property;

use App\Models\Property\Room;
use Spatie\QueryBuilder\QueryBuilder;

class RoomService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Room::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('code');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($propertyId = request()->input('property_id')) {
            $query->where('property_id', $propertyId);
        }

        if ($floorId = request()->input('floor_id')) {
            $query->where('floor_id', $floorId);
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Room::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->defaultSort('code');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Room
    {
        return Room::find($id);
    }

    public function findTrashed(string $id): ?Room
    {
        return Room::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Room
    {
        return Room::withTrashed()->find($id);
    }

    public function create(array $data): Room
    {
        return Room::create($data);
    }

    public function update(string $id, array $data): ?Room
    {
        $room = $this->find($id);
        if ($room) {
            $room->update($data);
        }

        return $room;
    }

    public function delete(string $id): bool
    {
        $room = $this->find($id);
        if ($room) {
            return $room->delete();
        }

        return false;
    }

    public function restore(string $id): bool
    {
        $room = $this->findTrashed($id);
        if ($room) {
            return $room->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $room = $this->findWithTrashed($id);
        if ($room) {
            return $room->forceDelete();
        }

        return false;
    }
}
