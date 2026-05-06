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
                'invoices' => $this->invoiceDashboardSummary($orgId, []),
            ];
        });
    }

    private function ownerRevenueStats(?string $orgId, Carbon $from, Carbon $to): array
    {
        if (! $orgId) {
            return ['current_period' => 0.0, 'previous_period' => 0.0, 'change_percent' => 0];
        }

        // Doanh thu theo kỳ hóa đơn (period), không dùng updated_at — tránh lệch khi seed/duyệt hàng loạt cùng lúc
        $currentPeriodRevenue = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'PAID')
            ->where('period_start', '<=', $to->copy()->endOfDay())
            ->where('period_end', '>=', $from->copy()->startOfDay())
            ->sum('paid_amount');

        // Previous period of equal length
        $rangeDays = $from->diffInDays($to);
        $prevTo = $from->copy()->subDay();
        $prevFrom = $prevTo->copy()->subDays($rangeDays);

        $previousPeriodRevenue = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->where('status', 'PAID')
            ->where('period_start', '<=', $prevTo->copy()->endOfDay())
            ->where('period_end', '>=', $prevFrom->copy()->startOfDay())
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

    /**
     * Tổng quan hóa đơn cho dashboard org (owner: toàn org; manager: chỉ property được gán).
     *
     * @param  string[]  $propertyIds  Rỗng = không lọc theo tòa (owner).
     * @return array{outstanding_debt: float, draft_pipeline_total: float, recent_paid: array<int, array<string, mixed>>, revenue_last_6_months: array<int, array<string, mixed>>, revenue_this_month: float}
     */
    private function invoiceDashboardSummary(?string $orgId, array $propertyIds = []): array
    {
        if (! $orgId) {
            return [
                'outstanding_debt' => 0.0,
                'draft_pipeline_total' => 0.0,
                'recent_paid' => [],
                'revenue_last_6_months' => [],
                'revenue_this_month' => 0.0,
            ];
        }

        $outstandingStatuses = ['ISSUED', 'OVERDUE', 'PARTIAL', 'PENDING', 'LATE'];

        $outstandingDebt = (float) Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->when(count($propertyIds) > 0, fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->whereIn('status', $outstandingStatuses)
            ->sum(DB::raw('GREATEST(0, total_amount - paid_amount)'));

        $draftPipelineTotal = (float) Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->when(count($propertyIds) > 0, fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->where('status', 'DRAFT')
            ->sum('total_amount');

        $recentPaid = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->when(count($propertyIds) > 0, fn ($q) => $q->whereIn('property_id', $propertyIds))
            ->where('status', 'PAID')
            ->with([
                'contract.members' => function ($q) {
                    $q->whereNull('left_at')->orderByDesc('is_primary')->orderBy('joined_at');
                },
            ])
            ->orderByDesc('updated_at')
            ->limit(5)
            ->get()
            ->map(function (Invoice $inv) {
                $member = $inv->contract?->members?->firstWhere('is_primary', true)
                    ?? $inv->contract?->members?->first();
                $label = $member?->full_name ?: 'Khách thuê';

                return [
                    'id' => $inv->id,
                    'paid_amount' => (float) $inv->paid_amount,
                    'updated_at' => $inv->updated_at?->toIso8601String(),
                    'counterparty_label' => $label,
                ];
            })
            ->toArray();

        // Doanh thu "đã thu" theo tháng: theo ngày nhận tiền (payments.received_at) + phân bổ HĐ — khớp Sổ cái / dòng tiền.
        // Không dùng invoice.updated_at (dễ dồn một tháng khi duyệt hàng loạt) hay period_start HĐ (lệch thời điểm thực thu).
        $revenueLast6Months = [];
        $now = Carbon::now();
        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $start = $month->copy()->startOfMonth()->startOfDay();
            $end = $month->copy()->endOfMonth()->endOfDay();

            $revenue = $this->collectedRevenueBetween($orgId, $propertyIds, $start, $end);

            $revenueLast6Months[] = [
                'month_key' => $month->format('Y-m'),
                'month_short' => $month->format('M'),
                'revenue' => $revenue,
            ];
        }

        $revenueThisMonth = $revenueLast6Months === [] ? 0.0 : (float) ($revenueLast6Months[array_key_last($revenueLast6Months)]['revenue'] ?? 0.0);

        return [
            'outstanding_debt' => $outstandingDebt,
            'draft_pipeline_total' => $draftPipelineTotal,
            'recent_paid' => $recentPaid,
            'revenue_last_6_months' => $revenueLast6Months,
            'revenue_this_month' => $revenueThisMonth,
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
                'invoices' => $this->invoiceDashboardSummary($orgId, $propertyIds),
            ];
        });
    }

    public function getPropertyDashboard(Property $property, Carbon $from, Carbon $to): array
    {
        $orgId = $property->org_id;
        $propertyIds = [$property->id];
        $cacheKey = "dashboard:property:{$property->id}:{$from->format('Y-m-d')}:{$to->format('Y-m-d')}";

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($orgId, $propertyIds, $from, $to, $property) {
            $tenants = $this->managerTenantStats($orgId, $propertyIds, $from, $to);
            $contracts = $this->managerContractStats($orgId, $propertyIds);
            $tickets = $this->managerTicketStats($orgId, $propertyIds);
            $propStats = $this->managerPropertyStats($orgId, $propertyIds);

            $unpaidInvoices = Invoice::withoutGlobalScopes()
                ->where('org_id', $orgId)
                ->whereIn('property_id', $propertyIds)
                ->whereIn('status', ['ISSUED', 'OVERDUE', 'PENDING'])
                ->count();

            // Số hợp đồng đang có ít nhất 1 hóa đơn OVERDUE
            $overdueContractCount = Contract::withoutGlobalScopes()
                ->where('org_id', $orgId)
                ->whereIn('property_id', $propertyIds)
                ->where('status', 'ACTIVE')
                ->whereHas('invoices', fn ($q) => $q->where('status', 'OVERDUE'))
                ->count();

            // Tổng số tiền nợ (chưa thu) của các hóa đơn quá hạn / chưa thanh toán đủ
            $totalOutstandingDebt = (float) Invoice::withoutGlobalScopes()
                ->where('org_id', $orgId)
                ->whereIn('property_id', $propertyIds)
                ->whereIn('status', ['OVERDUE', 'PARTIAL', 'ISSUED', 'LATE'])
                ->sum(DB::raw('GREATEST(0, total_amount - paid_amount)'));

            $monthStart = Carbon::now()->copy()->startOfMonth()->startOfDay();
            $monthEnd = Carbon::now()->copy()->endOfDay();
            $thisMonthCollected = $this->collectedRevenueBetween($orgId, $propertyIds, $monthStart, $monthEnd);

            // Previous month revenue trend
            $prevMonthStart = $monthStart->copy()->subMonth();
            $prevMonthEnd = $monthStart->copy()->subSecond();
            $prevMonthCollected = $this->collectedRevenueBetween($orgId, $propertyIds, $prevMonthStart, $prevMonthEnd);

            $revenueTrendValue = $prevMonthCollected > 0
                ? round((($thisMonthCollected - $prevMonthCollected) / $prevMonthCollected) * 100, 2)
                : ($thisMonthCollected > 0 ? 100 : 0);

            // Previous month tenants trend
            $currentActiveTenants = $tenants['active'];
            $prevMonthActiveTenants = ContractMember::withoutGlobalScopes()
                ->where('contract_members.org_id', $orgId)
                ->where('contract_members.joined_at', '<=', $prevMonthEnd)
                ->where(function ($q) use ($prevMonthEnd) {
                    $q->whereNull('contract_members.left_at')
                        ->orWhere('contract_members.left_at', '>', $prevMonthEnd);
                })
                ->whereHas('contract', function ($q) use ($propertyIds) {
                    $q->whereIn('property_id', $propertyIds);
                })
                ->count();

            $tenantTrendValue = $prevMonthActiveTenants > 0
                ? round((($currentActiveTenants - $prevMonthActiveTenants) / $prevMonthActiveTenants) * 100, 2)
                : ($currentActiveTenants > 0 ? 100 : 0);

            return [
                'stats' => [
                    'totalTenants' => $currentActiveTenants,
                    'totalRooms' => $propStats['total_rooms'],
                    'vacantRooms' => $propStats['available_rooms'],
                    'occupiedRooms' => $propStats['occupied_rooms'],
                    'occupancyRate' => $propStats['occupancy_rate'],
                    'pendingTickets' => $tickets['pending'],
                    'unresolvedTickets' => $tickets['pending'] + $tickets['in_progress'],
                    'unpaidInvoices' => $unpaidInvoices,
                    'activeContracts' => $contracts['total_active'],
                    'overdueContractCount' => $overdueContractCount,
                    'totalOutstandingDebt' => $totalOutstandingDebt,
                    'thisMonthRevenue' => $thisMonthCollected,
                    'revenueTrendValue' => $revenueTrendValue,
                    'tenantTrendValue' => $tenantTrendValue,
                ],
                'revenueTrend' => $this->getPropertyRevenueTrend($orgId, $property->id),
            ];
        });
    }

    private function getPropertyRevenueTrend(string $orgId, string $propertyId): array
    {
        $trend = [];
        $now = Carbon::now();

        for ($i = 5; $i >= 0; $i--) {
            $month = $now->copy()->subMonths($i);
            $start = $month->copy()->startOfMonth()->startOfDay();
            $end = $month->copy()->endOfMonth()->endOfDay();

            $revenue = $this->collectedRevenueBetween($orgId, [$propertyId], $start, $end);

            $trend[] = [
                'month' => $month->format('M'),
                'revenue' => $revenue,
            ];
        }

        return $trend;
    }

    /**
     * Tiền đã thu thực tế: tổng phân bổ thanh toán (payment_allocations) theo ngày nhận tiền (payments.received_at),
     * chỉ payment APPROVED — cùng định nghĩa với dòng tiền vào trong Sổ cái.
     *
     * @param  string[]  $propertyIds  Rỗng = không lọc theo tòa (toàn org).
     */
    private function collectedRevenueBetween(?string $orgId, array $propertyIds, Carbon $from, Carbon $to): float
    {
        if (! $orgId) {
            return 0.0;
        }

        $query = DB::table('payment_allocations')
            ->join('payments', 'payments.id', '=', 'payment_allocations.payment_id')
            ->join('invoices', 'invoices.id', '=', 'payment_allocations.invoice_id')
            ->where('payment_allocations.org_id', $orgId)
            ->where('payments.status', 'APPROVED')
            ->whereNull('payments.deleted_at')
            ->where('payments.received_at', '>=', $from)
            ->where('payments.received_at', '<=', $to);

        if (count($propertyIds) > 0) {
            $query->whereIn('invoices.property_id', $propertyIds);
        }

        return (float) $query->sum('payment_allocations.amount');
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

        // Tổng thành viên (contract_members) trên các HĐ ACTIVE thuộc tòa — không gộp distinct user_id
        $activeTenants = ContractMember::withoutGlobalScopes()
            ->where('contract_members.org_id', $orgId)
            ->whereNull('contract_members.left_at')
            ->whereHas('contract', function ($q) use ($propertyIds) {
                $q->where('status', 'ACTIVE')
                    ->whereIn('property_id', $propertyIds);
            })
            ->count();

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
            ->count();

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
            ->where('period_start', '<=', $to->copy()->endOfDay())
            ->where('period_end', '>=', $from->copy()->startOfDay())
            ->sum('paid_amount');

        $paidInvoiceIds = Invoice::withoutGlobalScopes()
            ->where('org_id', $orgId)
            ->whereIn('property_id', $propertyIds)
            ->where('status', 'PAID')
            ->where('period_start', '<=', $to->copy()->endOfDay())
            ->where('period_end', '>=', $from->copy()->startOfDay())
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
