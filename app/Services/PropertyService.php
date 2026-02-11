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

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Property
    {
        return Property::find($id);
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
}

