<?php

namespace App\Services\Property;

use App\Models\Property\Floor;
use Spatie\QueryBuilder\QueryBuilder;

class FloorService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Floor::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('sort_order')
            ->withCount('rooms');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($propertyId = request()->input('property_id')) {
            $query->where('property_id', $propertyId);
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Floor::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->defaultSort('sort_order')
            ->withCount('rooms');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Floor
    {
        return Floor::find($id);
    }

    public function findTrashed(string $id): ?Floor
    {
        return Floor::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Floor
    {
        return Floor::withTrashed()->find($id);
    }

    public function create(array $data): Floor
    {
        return Floor::create($data);
    }

    public function update(string $id, array $data): ?Floor
    {
        $floor = $this->find($id);
        if ($floor) {
            $floor->update($data);
        }

        return $floor;
    }

    public function delete(string $id): bool
    {
        $floor = $this->find($id);
        if ($floor) {
            return $floor->delete();
        }

        return false;
    }

    public function restore(string $id): bool
    {
        $floor = $this->findTrashed($id);
        if ($floor) {
            return $floor->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $floor = $this->findWithTrashed($id);
        if ($floor) {
            return $floor->forceDelete();
        }

        return false;
    }
}
