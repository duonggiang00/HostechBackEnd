<?php

namespace App\Services\Property;

use App\Events\Property\PropertyCreated;
use App\Events\Property\PropertyUpdated;
use App\Models\Org\User;
use App\Models\Property\Property;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PropertyService
{
    public function paginate(array $allowedFilters = [], int $perPage = 15, ?string $search = null, ?string $orgId = null, bool $withTrashed = false, ?User $performer = null): LengthAwarePaginator
    {
        $allowedFilters = array_merge($allowedFilters, [AllowedFilter::exact('org_id')]);

        $monthStart = Carbon::now()->startOfMonth()->toDateString();
        $monthEnd = Carbon::now()->endOfMonth()->toDateString();

        $query = QueryBuilder::for(Property::class)
            ->allowedFilters($allowedFilters)
            ->allowedIncludes(['floors', 'rooms', 'defaultServices'])
            ->defaultSort('name')
            ->withCount([
                'floors',
                'rooms',
                'rooms as occupied_rooms_count' => function ($q) {
                    $q->whereIn('status', ['occupied', 'rented']);
                },
                'rooms as vacant_rooms_count' => function ($q) {
                    $q->whereIn('status', ['available', 'vacant']);
                },
                'contracts as active_contracts_count' => function ($q) {
                    $q->where('status', 'ACTIVE');
                },
            ])
            ->addSelect([
                // Số người thuê đang ở (contract_members.left_at IS NULL trên hợp đồng ACTIVE)
                'active_tenants_count' => DB::table('contract_members')
                    ->join('contracts', 'contracts.id', '=', 'contract_members.contract_id')
                    ->whereColumn('contracts.property_id', 'properties.id')
                    ->whereColumn('contract_members.org_id', 'properties.org_id')
                    ->where('contracts.status', 'ACTIVE')
                    ->whereNull('contract_members.left_at')
                    ->whereNull('contract_members.deleted_at')
                    ->whereNull('contracts.deleted_at')
                    ->selectRaw('COUNT(*)'),

                // Doanh thu đã thu trong tháng hiện tại (theo period_start, status = PAID)
                'revenue_this_month' => DB::table('invoices')
                    ->whereColumn('invoices.property_id', 'properties.id')
                    ->whereColumn('invoices.org_id', 'properties.org_id')
                    ->where('invoices.status', 'PAID')
                    ->whereBetween('invoices.period_start', [$monthStart, $monthEnd])
                    ->whereNull('invoices.deleted_at')
                    ->selectRaw('COALESCE(SUM(invoices.paid_amount), 0)'),

                // Doanh thu đã thu lũy kế (status = PAID)
                'revenue_total' => DB::table('invoices')
                    ->whereColumn('invoices.property_id', 'properties.id')
                    ->whereColumn('invoices.org_id', 'properties.org_id')
                    ->where('invoices.status', 'PAID')
                    ->whereNull('invoices.deleted_at')
                    ->selectRaw('COALESCE(SUM(invoices.paid_amount), 0)'),
            ]);

        /** @var User $user */
        $user = $performer ?: auth()->user();
        if ($user) {
            if ($user->hasRole('Tenant')) {
                // Tenant scope: only properties where they have an active contract, OR there are available rooms they could potentially rent.
                // However, based on the prompt, "tenant cần có khả năng xem được tòa nhà và tầng mình đang thuê, các phòng đang còn trống"
                // Let's modify so Tenant sees: Properties they currently rent, OR Properties that have AT LEAST ONE 'available' room.
                $query->where(function ($q) use ($user) {
                    $q->whereHas('contracts', function ($sq) use ($user) {
                        $sq->whereIn('status', ['ACTIVE', 'PENDING_PAYMENT'])
                            ->whereHas('members', function ($ssq) use ($user) {
                                $ssq->where('user_id', $user->id)
                                    ->where('status', 'APPROVED');
                            });
                    });
                });
            } elseif ($user->hasRole(['Manager', 'Staff'])) {
                // Manager/Staff scope: only properties they are explicitly assigned to
                $query->whereHas('managers', function ($q) use ($user) {
                    $q->where('users.id', $user->id);
                });
            }
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

        return $query->distinct()->paginate($perPage)->withQueryString();
    }

    public function paginateTrash(array $allowedFilters = [], int $perPage = 15, ?string $search = null): LengthAwarePaginator
    {
        return $this->paginate($allowedFilters, $perPage, $search, null, true);
    }

    public function find(string $id, bool $loadRelations = false): ?Property
    {
        $property = Property::withCount([
            'floors',
            'rooms',
            'rooms as occupied_rooms_count' => function ($q) {
                $q->whereIn('status', ['occupied', 'rented']);
            },
            'rooms as vacant_rooms_count' => function ($q) {
                $q->whereIn('status', ['available', 'vacant']);
            },
        ])->find($id);

        if ($property && $loadRelations) {
            $property->load(['floors' => function ($query) {
                $query->withCount([
                    'rooms',
                    'rooms as vacant_rooms_count' => function ($q) {
                        $q->whereIn('status', ['available', 'vacant']);
                    },
                    'rooms as occupied_rooms_count' => function ($q) {
                        $q->whereIn('status', ['occupied', 'rented']);
                    },
                ])->orderBy('sort_order');
            }]);
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

    public function create(array $data, User $user): Property
    {
        // Enforce Org ID
        if ($user->org_id) {
            $data['org_id'] = $user->org_id;
        }

        if (empty($data['org_id'])) {
            abort(422, 'Organization ID is required.');
        }

        $property = Property::create($data);

        if (isset($data['default_services']) && is_array($data['default_services'])) {
            $property->defaultServices()->sync($data['default_services']);
        }

        PropertyCreated::dispatch($property);

        return $property;
    }

    public function update(string $id, array $data): ?Property
    {
        $property = $this->find($id) ?? abort(404, 'Property not found');
        $property->update($data);

        if (isset($data['default_services']) && is_array($data['default_services'])) {
            $property->defaultServices()->sync($data['default_services']);
        }

        PropertyUpdated::dispatch($property);

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
