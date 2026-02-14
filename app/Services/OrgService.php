<?php

namespace App\Services;

use App\Models\Org;
use Spatie\QueryBuilder\QueryBuilder;

class OrgService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Org::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('name')
            ->withCount(['properties', 'users']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(Org::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->defaultSort('name')
            ->withCount(['properties', 'users']);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Org
    {
        return Org::find($id);
    }

    public function findTrashed(string $id): ?Org
    {
        return Org::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Org
    {
        return Org::withTrashed()->find($id);
    }

    public function create(array $data): Org
    {
        return Org::create($data);
    }

    public function update(string $id, array $data): ?Org
    {
        $org = $this->find($id);
        if ($org) {
            $org->update($data);
        }

        return $org;
    }

    public function delete(string $id): bool
    {
        $org = $this->find($id);
        if ($org) {
            return $org->delete();
        }

        return false;
    }

    public function restore(string $id): bool
    {
        $org = $this->findTrashed($id);
        if ($org) {
            return $org->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $org = $this->findWithTrashed($id);
        if ($org) {
            return $org->forceDelete();
        }

        return false;
    }
}
