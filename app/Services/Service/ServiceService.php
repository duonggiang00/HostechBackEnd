<?php

namespace App\Services\Service;

use App\Models\Service\Service;
use App\Models\Service\ServiceRate;
use App\Models\Service\TieredRate;
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
            // Eager load current rate and its tiered rates to display price and tiers in list
            ->with(['currentRate.tieredRates']);

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
            ->with(['currentRate.tieredRates']);

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
        return Service::with(['currentRate.tieredRates'])->find($id);
    }

    public function findTrashed(string $id): ?Service
    {
        return Service::onlyTrashed()->with(['currentRate.tieredRates'])->find($id);
    }

    public function findWithTrashed(string $id): ?Service
    {
        return Service::withTrashed()->with(['currentRate.tieredRates'])->find($id);
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
            $tieredRates = $data['tiered_rates'] ?? [];
            
            // Remove rate data from service data
            $serviceData = collect($data)->except(['price', 'effective_from', 'tiered_rates'])->toArray();

            // 2. Create Service
            $service = Service::create($serviceData);

            // 3. Create Initial Rate
            $serviceRate = ServiceRate::create([
                'org_id' => $service->org_id,
                'service_id' => $service->id,
                'price' => $price,
                'effective_from' => $effectiveFrom,
                'created_by_user_id' => request()->user()?->id,
            ]);

            // 4. Create Tiered Rates
            if ($service->calc_mode === 'PER_METER' && !empty($tieredRates)) {
                $tiersToInsert = collect($tieredRates)->map(function ($tier) use ($serviceRate) {
                    return [
                        'id' => Str::uuid()->toString(),
                        'org_id' => $serviceRate->org_id,
                        'service_rate_id' => $serviceRate->id,
                        'tier_from' => $tier['tier_from'],
                        'tier_to' => $tier['tier_to'] ?? null,
                        'price' => $tier['price'],
                    ];
                })->toArray();
                
                TieredRate::insert($tiersToInsert);
            }

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
            $newPrice = isset($data['price']) ? (float) $data['price'] : (float) $service->current_price;
            $currentPrice = (float) $service->current_price;
            $hasPriceChanged = $newPrice !== $currentPrice;

            // 2. Handle Tiered Rates Changes
            $hasTiersChanged = false;
            $newTiers = [];
            if ($service->calc_mode === 'PER_METER' && isset($data['tiered_rates'])) {
                $currentTiers = $service->currentRate?->tieredRates->map(function($t) {
                    return [
                        'tier_from' => (int)$t->tier_from,
                        'tier_to' => $t->tier_to !== null ? (int)$t->tier_to : null,
                        'price' => (float)$t->price,
                    ];
                })->toArray() ?? [];
                
                $newTiers = collect($data['tiered_rates'])->map(function($t) {
                    return [
                        'tier_from' => (int)$t['tier_from'],
                        'tier_to' => $t['tier_to'] !== null ? (int)$t['tier_to'] : null,
                        'price' => (float)$t['price'],
                    ];
                })->toArray();
                
                $hasTiersChanged = json_encode($currentTiers) !== json_encode($newTiers);
            }

            // Create new rate record ONLY if price or tiers changed
            if ($hasPriceChanged || $hasTiersChanged) {
                $effectiveFrom = $data['effective_from'] ?? now()->toDateString();

                $serviceRate = ServiceRate::updateOrCreate(
                    [
                        'service_id' => $service->id,
                        'effective_from' => $effectiveFrom,
                    ],
                    [
                        'org_id' => $service->org_id,
                        'price' => $newPrice,
                        'created_by_user_id' => request()->user()?->id,
                    ]
                );

                // If updated an existing rate today, replace its tiers
                TieredRate::where('service_rate_id', $serviceRate->id)->delete();

                if ($service->calc_mode === 'PER_METER' && !empty($newTiers)) {
                    $tiersToInsert = collect($newTiers)->map(function ($tier) use ($serviceRate) {
                        return array_merge($tier, [
                            'id' => Str::uuid()->toString(),
                            'org_id' => $serviceRate->org_id,
                            'service_rate_id' => $serviceRate->id,
                        ]);
                    })->toArray();
                    
                    TieredRate::insert($tiersToInsert);
                }
            }

            // 3. Update Service Details
            $serviceData = collect($data)->except(['price', 'effective_from', 'tiered_rates'])->toArray();
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
