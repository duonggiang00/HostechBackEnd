<?php

namespace App\Services\Service;

use App\Models\Service\Service;
use App\Models\Service\ServiceRate;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Illuminate\Support\Str;

class ServiceService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null)
    {
        $query = QueryBuilder::for(Service::class)
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['code', 'name', 'created_at'])
            ->defaultSort('code')
            // Eager load current rate to display price in list
            ->with(['currentRate']); 

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

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null)
    {
        $query = QueryBuilder::for(Service::onlyTrashed())
            ->allowedFilters($allowedFilters)
            ->allowedSorts(['code', 'name', 'created_at'])
            ->defaultSort('code')
            ->with(['currentRate']);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function find(string $id): ?Service
    {
        return Service::with(['currentRate'])->find($id);
    }

    public function findTrashed(string $id): ?Service
    {
        return Service::onlyTrashed()->with(['currentRate'])->find($id);
    }

    public function findWithTrashed(string $id): ?Service
    {
        return Service::withTrashed()->with(['currentRate'])->find($id);
    }

    /**
     * Create Service and Initial Rate
     */
    public function create(array $data): Service
    {
        return DB::transaction(function () use ($data) {
            // 1. Extract Rate Data
            $price = $data['price'];
            $effectiveFrom = $data['effective_from'] ?? now()->toDateString();
            
            // Remove rate data from service data
            $serviceData = collect($data)->except(['price', 'effective_from'])->toArray();

            // 2. Create Service
            $service = Service::create($serviceData);

            // 3. Create Initial Rate
            ServiceRate::create([
                'org_id' => $service->org_id,
                'service_id' => $service->id,
                'price' => $price,
                'effective_from' => $effectiveFrom,
                'created_by_user_id' => auth()->id(),
            ]);

            return $service;
        });
    }

    /**
     * Update Service and potentially Create New Rate
     */
    public function update(string $id, array $data): ?Service
    {
        $service = $this->find($id);
        if (! $service) return null;

        return DB::transaction(function () use ($service, $data) {
            // 1. Handle Price Update
            if (isset($data['price'])) {
                $newPrice = (float) $data['price'];
                $currentPrice = (float) $service->current_price;

                // Create new rate record ONLY if price changed
                if ($newPrice !== $currentPrice) {
                    ServiceRate::create([
                        'org_id' => $service->org_id,
                        'service_id' => $service->id,
                        'price' => $newPrice,
                        'effective_from' => $data['effective_from'] ?? now()->toDateString(),
                        'created_by_user_id' => auth()->id(),
                    ]);
                }
            }

            // 2. Update Service Details
            $serviceData = collect($data)->except(['price', 'effective_from'])->toArray();
            if (! empty($serviceData)) {
                $service->update($serviceData);
            }

            return $service->refresh();
        });
    }

    public function delete(string $id): bool
    {
        $service = $this->find($id);
        if ($service) {
            return $service->delete();
        }
        return false;
    }

    public function restore(string $id): bool
    {
        $service = $this->findTrashed($id);
        if ($service) {
            return $service->restore();
        }
        return false;
    }

    public function forceDelete(string $id): bool
    {
        $service = $this->findWithTrashed($id);
        if ($service) {
            // ServiceRates satisfy foreign key cascade? 
            // Migration defined: $table->foreignUuid('service_id')->constrained('services')->cascadeOnDelete();
            // So DB will auto-delete rates.
            return $service->forceDelete();
        }
        return false;
    }
}
