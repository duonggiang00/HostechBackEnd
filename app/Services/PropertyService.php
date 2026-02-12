<?php

namespace App\Services;

use App\Models\Property;
use Spatie\QueryBuilder\QueryBuilder;

class PropertyService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15)
    {
        $query = QueryBuilder::for(Property::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('name');

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Property
    {
        return Property::find($id);
    }

    public function findTrashed(string $id): ?Property
    {
        return Property::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Property
    {
        return Property::withTrashed()->find($id);
    }

    public function create(array $data): Property
    {
        return Property::create($data);
    }

    public function update(string $id, array $data): ?Property
    {
        $property = $this->find($id);
        if ($property) {
            $property->update($data);
        }

        return $property;
    }

    public function delete(string $id): bool
    {
        $property = $this->find($id);
        if ($property) {
            return $property->delete();
        }

        return false;
    }

    public function restore(string $id): bool
    {
        $property = $this->findTrashed($id);
        if ($property) {
            return $property->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $property = $this->findWithTrashed($id);
        if ($property) {
            return $property->forceDelete();
        }

        return false;
    }
}
