<?php

namespace App\Services\Property;

use App\Models\Property\Property;
use Spatie\QueryBuilder\QueryBuilder;

class PropertyService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null, bool $withTrashed = false): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $query = QueryBuilder::for(Property::class)
            ->allowedFilters($allowedFilters)
            ->defaultSort('name')
            ->withCount(['floors', 'rooms']);

        /** @var \App\Models\Org\User $user */
        $user = auth()->user();
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

        if ($withTrashed) {
            $query->withTrashed();
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        return $this->paginate($allowedFilters, $perPage, $search, null, true);
    }

    public function find(string $id, bool $loadRelations = false): ?Property
    {
        $property = Property::find($id);

        if ($property && $loadRelations) {
            if ($property->floors()->exists()) {
                $property->load(['floors.rooms']);
            } else {
                $property->load('rooms');
            }
        }

        return $property;
    }

    public function findTrashed(string $id): ?Property
    {
        return Property::onlyTrashed()->find($id);
    }

    public function findWithTrashed(string $id): ?Property
    {
        return Property::withTrashed()->find($id);
    }

    public function create(array $data, \App\Models\Org\User $user): Property
    {
        // Enforce Org ID
        if ($user->org_id) {
            $data['org_id'] = $user->org_id;
        }

        if (empty($data['org_id'])) {
            abort(422, 'Organization ID is required.');
        }

        return Property::create($data);
    }

    public function update(string $id, array $data): ?Property
    {
        $property = $this->find($id) ?? abort(404, 'Property not found');
        $property->update($data);

        return $property;
    }

    public function delete(string $id): bool
    {
        $property = $this->find($id) ?? abort(404, 'Property not found');

        return $property->delete();
    }

    public function restore(string $id): bool
    {
        $property = $this->findTrashed($id) ?? abort(404, 'Property not found in trash');

        return $property->restore();
    }

    public function forceDelete(string $id): bool
    {
        $property = $this->findWithTrashed($id) ?? abort(404, 'Property not found');

        return $property->forceDelete();
    }
}
