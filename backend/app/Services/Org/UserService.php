<?php

namespace App\Services\Org;

use App\Models\Org\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Spatie\QueryBuilder\QueryBuilder;

class UserService
{
    /**
     * Paginate users
     */
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null, bool $withTrashed = false): LengthAwarePaginator
    {
        $query = QueryBuilder::for(User::class)
            ->with(['roles', 'permissions'])
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

        // Apply Property-based scoping for Manager and Staff
        $currentUser = auth()->user();
        if ($currentUser && ! $currentUser->hasRole(['Admin', 'Owner'])) {
            $query->whereHas('properties', function ($q) use ($currentUser) {
                $q->whereIn('properties.id', $currentUser->properties()->pluck('properties.id'));
            });
        }

        if ($withTrashed) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null): LengthAwarePaginator
    {
        return $this->paginate($allowedFilters, $perPage, $search, $orgId, true);
    }

    public function find(string $id): ?User
    {
        return User::find($id);
    }

    public function create(array $data, User $performer): User
    {
        // Security: Enforce Org Scope & Role Hierarchy for non-Admins
        if (! $performer->hasRole('Admin')) {
            if (isset($data['org_id']) && (string) $data['org_id'] !== (string) $performer->org_id) {
                abort(403, 'Unauthorized: You cannot create users for another organization.');
            }
            $data['org_id'] = $performer->org_id;

            if (isset($data['role'])) {
                $allowedRoles = ['MANAGER', 'STAFF', 'TENANT'];
                if (! in_array($data['role'], $allowedRoles)) {
                    abort(403, 'Unauthorized: You cannot create users with this role.');
                }
            }
        }

        if (isset($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password'], $data['password_confirmation']);
        }

        return User::create($data);
    }

    public function update(string $id, array $data, User $performer): ?User
    {
        $user = $this->find($id) ?? abort(404, 'User not found');

        // Security: Enforce Org Scope for non-Admins
        if (! $performer->hasRole('Admin')) {
            if (isset($data['org_id']) && (string) $data['org_id'] !== (string) $performer->org_id) {
                abort(403, 'Unauthorized: You cannot move users to another organization.');
            }

            if (isset($data['role'])) {
                $allowedRoles = ['MANAGER', 'STAFF', 'TENANT'];
                if (! in_array($data['role'], $allowedRoles)) {
                    abort(403, 'Unauthorized: You cannot assign this role.');
                }
            }
        }

        if (isset($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password'], $data['password_confirmation']);
        }

        $user->update($data);

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
