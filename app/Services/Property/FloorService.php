<?php

namespace App\Services\Property;

use App\Models\Property\Floor;
use App\Models\Property\Property;
use Spatie\QueryBuilder\QueryBuilder;

class FloorService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $propertyId = null, bool $withTrashed = false): \Illuminate\Contracts\Pagination\LengthAwarePaginator
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

        if ($propertyId) {
            $query->where('property_id', $propertyId);
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

    public function create(array $data, \App\Models\Org\User $user): Floor
    {
        $property = Property::find($data['property_id']) ?? abort(404, 'Property not found');

        // Security: Check if Property belongs to User's Org (if not Admin)
        if (! $user->hasRole('Admin') && $user->org_id && (string) $property->org_id !== (string) $user->org_id) {
            abort(403, 'Unauthorized: You cannot add floors to a property in another organization.');
        }

        // Auto-assign org_id from Property
        $data['org_id'] = $property->org_id;

        return Floor::create($data);
    }

    public function update(string $id, array $data): ?Floor
    {
        $floor = $this->find($id) ?? abort(404, 'Floor not found');
        $floor->update($data);

        return $floor;
    }

    public function delete(string $id): bool
    {
        $floor = $this->find($id) ?? abort(404, 'Floor not found');

        return $floor->delete();
    }

    public function restore(string $id): bool
    {
        $floor = $this->findTrashed($id) ?? abort(404, 'Floor not found in trash');

        return $floor->restore();
    }

    public function forceDelete(string $id): bool
    {
        $floor = $this->findWithTrashed($id) ?? abort(404, 'Floor not found');

        return $floor->forceDelete();
    }
}
