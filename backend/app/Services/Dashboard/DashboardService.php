<?php

namespace App\Services\Dashboard;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Models\Ticket\Ticket;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    // ──────────────────────────────────────────────────────────
    //  1. SUPER ADMIN (Admin role) — toàn hệ thống
    // ──────────────────────────────────────────────────────────

    public function getAdminDashboard(Carbon $from, Carbon $to): array
    {
        $cacheKey = "dashboard:admin:{$from->format('Y-m-d')}:{$to->format('Y-m-d')}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($from, $to) {
            return [
                'organizations' => $this->adminOrgStats($from, $to),
                'users' => $this->adminUserStats(),
                'properties' => $this->adminPropertyStats(),
            ];
        });
    }

    private function adminOrgStats(Carbon $from, Carbon $to): array
    {
        $total = Org::withoutGlobalScopes()->count();

        $newInRange = Org::withoutGlobalScopes()
            ->whereBetween('created_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->count();

        // Biểu đồ tăng trưởng 6 tháng gần nhất
        $now = Carbon::now();
        $growth = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $growth[] = [
                'month' => $month->format('Y-m'),
                'count' => Org::withoutGlobalScopes()
                    ->whereBetween('created_at', [
                        $month->copy()->startOfMonth(),
                        $month->copy()->endOfMonth(),
                    ])
                    ->count(),
            ];
        }

        return [
            'total' => $total,
            'new_in_range' => $newInRange,
            'growth_last_6_months' => $growth,
        ];
    }

    private function adminUserStats(): array
    {
        $total = User::withoutGlobalScopes()->count();

        $byRole = DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', (new User)->getMorphClass())
            ->select('roles.name', DB::raw('COUNT(*) as count'))
            ->groupBy('roles.name')
            ->pluck('count', 'name')
            ->toArray();

        return [
            'total' => $total,
            'by_role' => [
                'owner' => $byRole['Owner'] ?? 0,
                'manager' => $byRole['Manager'] ?? 0,
                'staff' => $byRole['Staff'] ?? 0,
                'tenant' => $byRole['Tenant'] ?? 0,
            ],
        ];
    }

    private function adminPropertyStats(): array
    {
        $totalProperties = Property::withoutGlobalScopes()->count();
        $totalRooms = Room::withoutGlobalScopes()->count();
        $occupiedRooms = Room::withoutGlobalScopes()->where('status', 'occupied')->count();

        return [
            'total_properties' => $totalProperties,
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'available_rooms' => $totalRooms - $occupiedRooms,
            'occupancy_rate' => $totalRooms > 0
                ? round(($occupiedRooms / $totalRooms) * 100, 2)
                : 0,
        ];
    }

    // ──────────────────────────────────────────────────────────
    //  2. OWNER — theo dõi hiệu quả kinh doanh Org
    // ──────────────────────────────────────────────────────────

    public function getOwnerDashboard(User $user, Carbon $from, Carbon $to): array
    {
        $orgId = $user->org_id;
        $cacheKey = "dashboard:owner:{$orgId}:{$from->format('Y-m-d')}:{$to->format('Y-m-d')}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($orgId, $from, $to) {
            return [
                'revenue' => $this->ownerRevenueStats($orgId, $from, $to),
                'properties' => $this->ownerPropertyStats($orgId),
                'staff' => $this->ownerStaffStats($orgId),
                'contracts' => $this->ownerContractStats($orgId, $from, $to),
            ];
        });
    }

    private function ownerRevenueStats(?string $orgId, Carbon $from, Carbon $to): array
    {
        if (! $orgId) {
            return ['current_period' => 0.0, 'previous_period' => 0.0, 'change_percent' => 0];
        }

        $currentPeriodRevenue = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'PAID')
            ->whereBetween('updated_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->sum('paid_amount');

        // Previous period of equal length
        $rangeDays = $from->diffInDays($to);
        $prevTo = $from->copy()->subDay();
        $prevFrom = $prevTo->copy()->subDays($rangeDays);

        $previousPeriodRevenue = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'PAID')
            ->whereBetween('updated_at', [$prevFrom->startOfDay(), $prevTo->endOfDay()])
            ->sum('paid_amount');

        $change = $previousPeriodRevenue > 0
            ? round((($currentPeriodRevenue - $previousPeriodRevenue) / $previousPeriodRevenue) * 100, 2)
            : ($currentPeriodRevenue > 0 ? 100 : 0);

        return [
            'current_period' => (float) $currentPeriodRevenue,
            'previous_period' => (float) $previousPeriodRevenue,
            'change_percent' => $change,
        ];
    }

    private function ownerPropertyStats(?string $orgId): array
    {
        if (! $orgId) {
            return ['total_properties' => 0, 'total_rooms' => 0, 'occupied_rooms' => 0, 'available_rooms' => 0, 'occupancy_rate' => 0, 'list' => []];
        }

        $properties = Property::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->withCount([
                'rooms',
                'rooms as occupied_rooms_count' => function ($q) {
                    $q->where('status', 'occupied');
                },
                'rooms as available_rooms_count' => function ($q) {
                    $q->where('status', 'available');
                },
            ])
            ->get(['id', 'code', 'name', 'address']);

        $totalRooms = $properties->sum('rooms_count');
        $occupiedRooms = $properties->sum('occupied_rooms_count');

        return [
            'total_properties' => $properties->count(),
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'available_rooms' => $properties->sum('available_rooms_count'),
            'occupancy_rate' => $totalRooms > 0
                ? round(($occupiedRooms / $totalRooms) * 100, 2)
                : 0,
            'list' => $properties->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'address' => $p->address,
                'rooms_count' => $p->rooms_count,
                'occupied_rooms_count' => $p->occupied_rooms_count,
                'available_rooms_count' => $p->available_rooms_count,
            ])->toArray(),
        ];
    }

    private function ownerStaffStats(?string $orgId): array
    {
        if (! $orgId) {
            return ['managers' => 0, 'staff' => 0, 'total' => 0];
        }

        $managers = User::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('is_active', true)
            ->role('Manager')
            ->count();

        $staff = User::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('is_active', true)
            ->role('Staff')
            ->count();

        return [
            'managers' => $managers,
            'staff' => $staff,
            'total' => $managers + $staff,
        ];
    }

    private function ownerContractStats(?string $orgId, Carbon $from, Carbon $to): array
    {
        if (! $orgId) {
            return ['total_active' => 0, 'expiring_in_30_days' => 0, 'new_in_range' => 0];
        }

        $now = Carbon::now();

        $expiringContracts = Contract::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'ACTIVE')
            ->whereBetween('end_date', [$now, $now->copy()->addDays(30)])
            ->count();

        $newContracts = Contract::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'ACTIVE')
            ->whereBetween('signed_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->count();

        $totalActive = Contract::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'ACTIVE')
            ->count();

        return [
            'total_active' => $totalActive,
            'expiring_in_30_days' => $expiringContracts,
            'new_in_range' => $newContracts,
        ];
    }

    // ──────────────────────────────────────────────────────────
    //  3. MANAGER & STAFF — vận hành Property được phân công
    // ──────────────────────────────────────────────────────────

    public function getManagerDashboard(User $user, Carbon $from, Carbon $to): array
    {
        $orgId = $user->org_id;
        $propertyIds = $user->properties()->pluck('properties.id')->toArray();
        $cacheKey = "dashboard:manager:{$user->id}:{$from->format('Y-m-d')}:{$to->format('Y-m-d')}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($orgId, $propertyIds, $from, $to) {
            return [
                'tenants' => $this->managerTenantStats($orgId, $propertyIds, $from, $to),
                'revenue' => $this->managerRevenueStats($orgId, $propertyIds, $from, $to),
                'contracts' => $this->managerContractStats($orgId, $propertyIds),
                'tickets' => $this->managerTicketStats($orgId, $propertyIds),
                'properties' => $this->managerPropertyStats($orgId, $propertyIds),
            ];
        });
    }

    private function managerPropertyStats(?string $orgId, array $propertyIds): array
    {
        if (! $orgId || empty($propertyIds)) {
            return ['total_properties' => 0, 'total_rooms' => 0, 'occupied_rooms' => 0, 'available_rooms' => 0, 'occupancy_rate' => 0];
        }

        $properties = Property::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('id', $propertyIds)
            ->withCount([
                'rooms',
                'rooms as occupied_rooms_count' => function ($q) {
                    $q->where('status', 'occupied');
                },
                'rooms as available_rooms_count' => function ($q) {
                    $q->where('status', 'available');
                },
            ])
            ->get();

        $totalRooms = $properties->sum('rooms_count');
        $occupiedRooms = $properties->sum('occupied_rooms_count');

        return [
            'total_properties' => $properties->count(),
            'total_rooms' => $totalRooms,
            'occupied_rooms' => $occupiedRooms,
            'available_rooms' => $properties->sum('available_rooms_count'),
            'occupancy_rate' => $totalRooms > 0
                ? round(($occupiedRooms / $totalRooms) * 100, 2)
                : 0,
        ];
    }

    private function managerTenantStats(?string $orgId, array $propertyIds, Carbon $from, Carbon $to): array
    {
        if (! $orgId) {
            return ['active' => 0, 'new_in_range' => 0];
        }

        $activeTenants = ContractMember::withoutGlobalScopes()
            ->where('contract_members.org_id', $orgId)
            ->whereNull('contract_members.left_at')
            ->whereHas('contract', function ($q) use ($propertyIds) {
                $q->where('status', 'ACTIVE')
                    ->whereIn('property_id', $propertyIds);
            })
            ->distinct('user_id')
            ->count('user_id');

        $newTenants = ContractMember::withoutGlobalScopes()
            ->where('contract_members.org_id', $orgId)
            ->whereNull('contract_members.left_at')
            ->whereBetween('contract_members.joined_at', [
                $from->copy()->startOfDay(),
                $to->copy()->endOfDay(),
            ])
            ->whereHas('contract', function ($q) use ($propertyIds) {
                $q->where('status', 'ACTIVE')
                    ->whereIn('property_id', $propertyIds);
            })
            ->distinct('user_id')
            ->count('user_id');

        return [
            'active' => $activeTenants,
            'new_in_range' => $newTenants,
        ];
    }

    private function managerRevenueStats(?string $orgId, array $propertyIds, Carbon $from, Carbon $to): array
    {
        if (! $orgId) {
            return ['total' => 0.0, 'rent' => 0.0, 'service' => 0.0];
        }

        $totalRevenue = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'PAID')
            ->whereBetween('updated_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->sum('paid_amount');

        $paidInvoiceIds = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'PAID')
            ->whereBetween('updated_at', [$from->copy()->startOfDay(), $to->copy()->endOfDay()])
            ->pluck('id');

        $rentRevenue = InvoiceItem::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('invoice_id', $paidInvoiceIds)
            ->where('type', 'RENT')
            ->sum('amount');

        $serviceRevenue = InvoiceItem::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('invoice_id', $paidInvoiceIds)
            ->where('type', 'SERVICE')
            ->sum('amount');

        return [
            'total' => (float) $totalRevenue,
            'rent' => (float) $rentRevenue,
            'service' => (float) $serviceRevenue,
        ];
    }

    private function managerContractStats(?string $orgId, array $propertyIds): array
    {
        if (! $orgId) {
            return ['total_active' => 0, 'expiring_in_30_days' => 0, 'overdue' => 0];
        }

        $now = Carbon::now();

        $expiringContracts = Contract::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'ACTIVE')
            ->whereBetween('end_date', [$now, $now->copy()->addDays(30)])
            ->count();

        $overdueContracts = Contract::withoutGlobalScopes()
            ->where('contracts.org_id', $orgId)
            ->whereIn('contracts.property_id', $propertyIds)
            ->where('contracts.status', 'ACTIVE')
            ->whereHas('invoices', function ($q) {
                $q->where('status', 'OVERDUE');
            })
            ->count();

        $totalActive = Contract::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'ACTIVE')
            ->count();

        return [
            'total_active' => $totalActive,
            'expiring_in_30_days' => $expiringContracts,
            'overdue' => $overdueContracts,
        ];
    }

    private function managerTicketStats(?string $orgId, array $propertyIds): array
    {
        if (! $orgId) {
            return ['pending' => 0, 'in_progress' => 0, 'done' => 0, 'cancelled' => 0, 'total' => 0, 'by_status' => []];
        }

        $statuses = Ticket::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $pending = ($statuses['OPEN'] ?? 0) + ($statuses['RECEIVED'] ?? 0);
        $inProgress = ($statuses['IN_PROGRESS'] ?? 0) + ($statuses['WAITING_PARTS'] ?? 0);
        $done = $statuses['DONE'] ?? 0;
        $cancelled = $statuses['CANCELLED'] ?? 0;

        // Calculate MTTR in hours for DONE tickets in the last 30 days
        $mttr = Ticket::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'DONE')
            ->whereNotNull('updated_at')
            ->where('updated_at', '>=', now()->subDays(30))
            ->select(DB::raw('AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)) as avg_hours'))
            ->first()
            ->avg_hours ?? 0;

        return [
            'pending' => $pending,
            'in_progress' => $inProgress,
            'done' => $done,
            'cancelled' => $cancelled,
            'total' => $pending + $inProgress + $done + $cancelled,
            'mttr_hours' => round((float) $mttr, 1),
            'by_status' => $statuses,
        ];
    }
}
