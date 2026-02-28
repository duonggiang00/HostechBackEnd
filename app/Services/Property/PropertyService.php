<?php

namespace App\Services\Property;

use App\Models\Property\Property;
use Spatie\QueryBuilder\QueryBuilder;

class PropertyService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null)
    {
        $query = QueryBuilder::for(Property::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('name')
            ->withCount(['floors', 'rooms']);

        $user = request()->user();
        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('contracts', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
                  ->whereHas('members', function ($sq) use ($user) {
                      $sq->where('user_id', $user->id)
                         ->where('status', 'APPROVED');
                  });
            });
        }

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Property::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->defaultSort('name')
            ->withCount(['floors', 'rooms']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
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
