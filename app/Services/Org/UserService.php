<?php

namespace App\Services\Org;

use App\Models\Org\User;
use Spatie\QueryBuilder\QueryBuilder;

class UserService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null)
    {
        $query = QueryBuilder::for(User::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('full_name');

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null)
    {
        $query = QueryBuilder::for(User::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->defaultSort('full_name');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?User
    {
        return User::find($id);
    }

    public function create(array $data): User
    {
        return User::create($data);
    }

    public function update(string $id, array $data): ?User
    {
        $user = $this->find($id);
        if ($user) {
            $user->update($data);
        }

        return $user;
    }

    public function delete(string $id): bool
    {
        $user = $this->find($id);
        if ($user) {
            return $user->delete();
        }

        return false;
    }

    public function findTrashed(string $id): ?User
    {
        return User::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?User
    {
        return User::withTrashed()->find($id);
    }

    public function restore(string $id): bool
    {
        $user = $this->findTrashed($id);
        if ($user) {
            return $user->restore();
        }

        return false;
    }

    public function forceDelete(string $id): bool
    {
        $user = $this->findWithTrashed($id);
        if ($user) {
            return $user->forceDelete();
        }

        return false;
    }
}
