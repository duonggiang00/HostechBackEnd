<?php

namespace App\Services\Invoice;

use App\Enums\ContractStatus;
use App\Events\Billing\InvoiceGenerated;
use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Invoice\Payment;
use App\Models\Org\User;
use App\Models\Property\Property;
use App\Models\Property\Room;
use App\Services\Finance\PaymentService;
use App\Services\OrgContextResolver;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceService
{
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬â€
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ  READ OPERATIONS                                      ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â£

    /**
     * LÃƒÂ¡Ã‚ÂºÃ‚Â¥y tÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢ng sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ tiÃƒÂ¡Ã‚Â»Ã‚Ân nÃƒÂ¡Ã‚Â»Ã‚Â£ chÃƒâ€ Ã‚Â°a thanh toÃƒÆ’Ã‚Â¡n cÃƒÂ¡Ã‚Â»Ã‚Â§a mÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng (bao gÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“m cÃƒÆ’Ã‚Â¡c hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n ISSUED, LATE, PARTIAL).
     */
    public function getUnpaidBalance(string $contractId): float
    {
        return (float) Invoice::where('contract_id', $contractId)
            ->whereIn('status', ['ISSUED', 'LATE', 'PARTIAL', 'OVERDUE'])
            ->sum('total_amount');
    }

    /**
     * HÃƒÂ¡Ã‚Â»Ã‚Â§y/VÃƒÆ’Ã‚Â´ hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡u hÃƒÆ’Ã‚Â³a toÃƒÆ’Ã‚Â n bÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n chÃƒâ€ Ã‚Â°a thanh toÃƒÆ’Ã‚Â¡n cÃƒÂ¡Ã‚Â»Ã‚Â§a mÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng (dÃƒÆ’Ã‚Â¹ng khi Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ gom tiÃƒÂ¡Ã‚Â»Ã‚Ân vÃƒÆ’Ã‚Â o hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n thanh lÃƒÆ’Ã‚Â½).
     */
    public function voidUnpaidInvoicesByContract(string $contractId, string $note = ''): void
    {
        Invoice::where('contract_id', $contractId)
            ->whereIn('status', ['ISSUED', 'LATE', 'PARTIAL', 'OVERDUE'])
            ->update([
                'status' => 'CANCELLED',
                'snapshot->void_reason' => 'Da gop vao hoa don thanh ly: '.$note,
            ]);
    }

    /**
     * Phân trang danh sách hóa đơn (Hỗ trợ lọc, sắp xếp và tìm kiếm).
     */
    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ): LengthAwarePaginator {
        $query = QueryBuilder::for(Invoice::class)
            ->allowedFilters([
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
            ])
            ->allowedSorts([
                'due_date',
                'period_start',
                'period_end',
                'total_amount',
                'status',
                'created_at',
            ])
            ->defaultSort('-created_at')
            ->with(['property', 'room', 'contract', 'items']);

        $user = request()->user();
        $resolved = OrgContextResolver::resolveOrgId($user);
        $effectiveOrgId = $orgId ?? $resolved;
        if ($user?->hasRole('Admin')) {
            abort_if(! $effectiveOrgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');
        }
        if ($effectiveOrgId) {
            $query->where('org_id', $effectiveOrgId);
        }

        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('contract', function ($q) use ($user) {
                $q->whereIn('status', [ContractStatus::ACTIVE->value, ContractStatus::PENDING_PAYMENT->value])
                    ->whereHas('members', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id)
                            ->where('status', 'APPROVED');
                    });
            });
        } elseif ($user && $user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        // Tìm kiếm theo mã phòng hoặc tên tòa nhà
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('room', function ($rq) use ($search) {
                    $rq->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                })
                    ->orWhereHas('property', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Danh sach hoa don da xoa mem (thung rac).
     */
    public function paginateTrash(
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ): LengthAwarePaginator {
        $query = QueryBuilder::for(Invoice::onlyTrashed())
            ->allowedFilters([
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::exact('status'),
            ])
            ->allowedSorts([
                'due_date',
                'period_start',
                'period_end',
                'total_amount',
                'status',
                'created_at',
            ])
            ->defaultSort('-created_at')
            ->with(['property', 'room']);

        $user = request()->user();
        $resolved = OrgContextResolver::resolveOrgId($user);
        $effectiveOrgId = $orgId ?? $resolved;
        if ($user?->hasRole('Admin')) {
            abort_if(! $effectiveOrgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');
        }
        if ($effectiveOrgId) {
            $query->where('org_id', $effectiveOrgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas(
                    'room',
                    fn ($rq) => $rq->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                )
                    ->orWhereHas('property', function ($pq) use ($search) {
                        $pq->where('name', 'like', "%{$search}%");
                    });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Danh sách hóa đơn của một tòa nhà cụ thể.
     */
    public function paginateByProperty(
        string $propertyId,
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ): LengthAwarePaginator {
        $query = QueryBuilder::for(
            Invoice::where('property_id', $propertyId)
        )
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::callback('is_termination', fn ($query, $value) => $query->where('is_termination', (bool) $value)),
                AllowedFilter::callback('has_outstanding', function ($q, $value): void {
                    if (filter_var($value, FILTER_VALIDATE_BOOLEAN)) {
                        $q->whereRaw('(total_amount - COALESCE(paid_amount, 0)) > 0.009')
                            ->whereNotIn('status', ['PAID', 'CANCELLED']);
                    }
                }),
            ])
            ->allowedSorts([
                'due_date',
                'period_start',
                'period_end',
                'total_amount',
                'status',
                'created_at',
            ])
            ->defaultSort('-created_at')
            ->with(['property', 'room', 'contract.primaryMember.user', 'items']);

        $user = request()->user();
        $resolved = OrgContextResolver::resolveOrgId($user);
        $effectiveOrgId = $orgId ?? $resolved;
        if ($user?->hasRole('Admin')) {
            abort_if(! $effectiveOrgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');
        }
        if ($effectiveOrgId) {
            $query->where('org_id', $effectiveOrgId);
        }

        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('contract', function ($q) use ($user) {
                $q->whereIn('status', [ContractStatus::ACTIVE->value, ContractStatus::PENDING_PAYMENT->value])
                    ->whereHas('members', function ($sq) use ($user) {
                        $sq->where('user_id', $user->id)
                            ->where('status', 'APPROVED');
                    });
            });
        } elseif ($user && $user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('room', function ($rq) use ($search) {
                    $rq->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Danh sách hóa đơn của một tầng cụ thể trong tòa nhà.
     */
    public function paginateByFloor(
        string $propertyId,
        string $floorId,
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ): LengthAwarePaginator {
        $query = QueryBuilder::for(
            Invoice::where('property_id', $propertyId)
                ->whereHas('room', function ($q) use ($floorId) {
                    $q->where('floor_id', $floorId);
                })
        )
            ->allowedFilters([
                AllowedFilter::exact('status'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::callback('is_termination', fn ($query, $value) => $query->where('is_termination', (bool) $value)),
            ])
            ->allowedSorts([
                'due_date',
                'period_start',
                'period_end',
                'total_amount',
                'status',
                'created_at',
            ])
            ->defaultSort('-created_at')
            ->with(['property', 'room', 'contract', 'items']);

        $user = request()->user();
        $resolved = OrgContextResolver::resolveOrgId($user);
        $effectiveOrgId = $orgId ?? $resolved;
        if ($user?->hasRole('Admin')) {
            abort_if(! $effectiveOrgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');
        }
        if ($effectiveOrgId) {
            $query->where('org_id', $effectiveOrgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas('room', function ($rq) use ($search) {
                    $rq->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            });
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Tìm một hóa đơn theo ID (kèm quan hệ dùng trên InvoiceResource).
     */
    public function find(string $id): ?Invoice
    {
        return Invoice::query()
            ->with([
                'property',
                'room',
                'contract',
                'items',
                'statusHistories',
                'adjustments',
                'createdBy',
                'issuedBy',
                'paymentAllocations' => function ($q) {
                    $q->with([
                        'payment' => function ($pq) {
                            $pq->with('receipt');
                        },
                    ]);
                },
            ])
            ->find($id);
    }

    public function findTrashed(string $id): ?Invoice
    {
        return Invoice::onlyTrashed()
            ->with(['property', 'room', 'contract', 'items'])
            ->find($id);
    }

    public function findWithTrashed(string $id): ?Invoice
    {
        return Invoice::withTrashed()
            ->with(['property', 'room', 'contract', 'items'])
            ->find($id);
    }

    // ────────────────────────────────────────────────────────────────────────
    //   WRITE OPERATIONS
    // ────────────────────────────────────────────────────────────────────────

    /**
     * Tạo hóa đơn mới kèm danh sách items.
     * Tự động chốt số đồng hồ nếu có metadata.
     */
    public function create(array $data, array $itemsData = []): Invoice
    {
        $user = request()->user();

        // Auto-assign org_id
        if ($user && ! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } else {
            if (! isset($data['org_id'])) {
                $room = Room::find($data['room_id'] ?? null);
                $data['org_id'] = $room?->org_id;
            }
        }
        $data['created_by_user_id'] = $user?->id;

        return DB::transaction(function () use ($data, $itemsData, $user) {
            if (($data['status'] ?? null) === 'ISSUED') {
                $now = now();
                if (empty($data['issue_date'])) {
                    $data['issue_date'] = $now->toDateString();
                }
                if (empty($data['issued_at'])) {
                    $data['issued_at'] = $now;
                }
                if (empty($data['issued_by_user_id']) && $user?->id) {
                    $data['issued_by_user_id'] = $user->id;
                }
            }

            if (! empty($data['contract_id']) && isset($data['period_start'], $data['period_end'])) {
                $dup = Invoice::query()
                    ->where('contract_id', $data['contract_id'])
                    ->whereDate('period_start', $data['period_start'])
                    ->whereDate('period_end', $data['period_end'])
                    ->where('is_termination', false)
                    ->whereNotIn('status', ['CANCELLED'])
                    ->exists();

                if ($dup) {
                    throw ValidationException::withMessages([
                        'period' => ['Đã tồn tại hóa đơn cho hợp đồng và kỳ thanh toán này.'],
                    ]);
                }
            }

            // 1. Tạo hóa đơn gốc
            $invoice = Invoice::create($data);

            // 2. Tạo các dòng chi tiết
            $totalAmount = 0;
            foreach ($itemsData as $itemData) {
                $itemData['org_id'] = $data['org_id'];
                $created = $invoice->items()->create($itemData);
                $totalAmount += $created->amount;
            }

            // 3. Cập nhật tổng tiền (luôn cập nhật)
            $invoice->update(['total_amount' => $totalAmount]);

            // 4. EDA: phát event để listener xử lý side-effects (notify, PDF, lock meter readings...)
            if (($invoice->status ?? 'DRAFT') === 'ISSUED') {
                $this->dispatchInvoiceGeneratedSafely($invoice->fresh('items'));
            }

            return $invoice->load('items');
        });
    }

    /**
     * CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n.
     * NÃƒÂ¡Ã‚ÂºÃ‚Â¿u trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i thay Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢i, tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng ghi lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­.
     */
    public function update(string $id, array $data): ?Invoice
    {
        $invoice = $this->find($id);
        if (! $invoice) {
            return null;
        }

        return DB::transaction(function () use ($invoice, $data) {
            $oldStatus = $invoice->status;

            $invoice->update($data);

            return $invoice->refresh();
        });
    }

    /**
     * XÃƒÆ’Ã‚Â³a mÃƒÂ¡Ã‚Â»Ã‚Âm hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n.
     */
    public function delete(string $id): bool
    {
        $invoice = $this->find($id);
        if (! $invoice) {
            return false;
        }

        return $invoice->delete();
    }

    /**
     * KhÃƒÆ’Ã‚Â´i phÃƒÂ¡Ã‚Â»Ã‚Â¥c hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ xÃƒÆ’Ã‚Â³a mÃƒÂ¡Ã‚Â»Ã‚Âm.
     */
    public function restore(string $id): bool
    {
        $invoice = $this->findTrashed($id);
        if (! $invoice) {
            return false;
        }

        return $invoice->restore();
    }

    /**
     * XÃƒÆ’Ã‚Â³a vÃƒâ€žÃ‚Â©nh viÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¦n.
     */
    public function forceDelete(string $id): bool
    {
        $invoice = $this->findWithTrashed($id);
        if (! $invoice) {
            return false;
        }

        return $invoice->forceDelete();
    }

    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬â€
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ  INVOICE ITEMS OPERATIONS                             ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â£

    /**
     * ThÃƒÆ’Ã‚Âªm 1 dÃƒÆ’Ã‚Â²ng chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t phÃƒÆ’Ã‚Â­ vÃƒÆ’Ã‚Â o hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n.
     * TÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t lÃƒÂ¡Ã‚ÂºÃ‚Â¡i total_amount.
     */
    public function storeItem(Invoice $invoice, array $itemData): InvoiceItem
    {
        return DB::transaction(function () use ($invoice, $itemData) {
            $itemData['org_id'] = $invoice->org_id;
            $item = $invoice->items()->create($itemData);

            // Recalculate total
            $this->recalculateTotalAmount($invoice);

            return $item;
        });
    }

    /**
     * XÃƒÆ’Ã‚Â³a 1 dÃƒÆ’Ã‚Â²ng chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t khÃƒÂ¡Ã‚Â»Ã‚Âi hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n.
     * TÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t lÃƒÂ¡Ã‚ÂºÃ‚Â¡i total_amount.
     */
    public function destroyItem(InvoiceItem $item): bool
    {
        return DB::transaction(function () use ($item) {
            $invoice = $item->invoice;
            $item->delete();

            // Recalculate total
            $this->recalculateTotalAmount($invoice);

            return true;
        });
    }

    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬â€
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ  STATUS TRANSITIONS                                   ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â£

    /**
     * PhÃƒÆ’Ã‚Â¡t hÃƒÆ’Ã‚Â nh hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n: DRAFT ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ISSUED.
     * Ghi nhÃƒÂ¡Ã‚ÂºÃ‚Â­n issue_date, issued_at, issued_by_user_id vÃƒÆ’Ã‚Â  lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i.
     */
    public function issueInvoice(Invoice $invoice, ?string $issuedByUserId = null, ?string $note = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $issuedByUserId, $note) {
            // TruyÃƒÂ¡Ã‚Â»Ã‚Ân ghi chÃƒÆ’Ã‚Âº trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i cho Observer
            if ($note) {
                $invoice->status_history_note = $note;
            }

            $invoice->update([
                'status' => 'ISSUED',
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => $issuedByUserId,
            ]);

            $invoice->refresh();
            $this->dispatchInvoiceGeneratedSafely($invoice);

            return $invoice;
        });
    }

    /**
     * Thanh toÃƒÆ’Ã‚Â¡n hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n: ISSUED/PENDING ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ PAID.
     * Ghi nhÃƒÂ¡Ã‚ÂºÃ‚Â­n paid_amount = total_amount vÃƒÆ’Ã‚Â  lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i.
     *
     * NÃƒÂ¡Ã‚ÂºÃ‚Â¿u lÃƒÆ’Ã‚Â  Initial Invoice (hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n kÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng) ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng kÃƒÆ’Ã‚Â­ch hoÃƒÂ¡Ã‚ÂºÃ‚Â¡t hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng.
     */
    public function payInvoice(Invoice $invoice, ?string $note = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $note) {
            if ($note) {
                $invoice->status_history_note = $note;
            }

            $invoice->update([
                'status' => 'PAID',
                'paid_amount' => $invoice->total_amount,
            ]);

            // Hook: KÃƒÆ’Ã‚Â­ch hoÃƒÂ¡Ã‚ÂºÃ‚Â¡t hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng nÃƒÂ¡Ã‚ÂºÃ‚Â¿u lÃƒÆ’Ã‚Â  hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n ban Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u
            $this->activateContractIfInitialInvoice($invoice);

            return $invoice->refresh();
        });
    }

    /**
     * Ghi nhận thanh toán một phần / toàn phần bằng tiền cọc (credit) trong luồng thanh lý EDA — không tạo Payment.
     *
     * @return float Số tiền credit còn lại sau khi áp dụng
     */
    public function applyDepositCreditTowardInvoice(Invoice $invoice, float $creditAmount, string $note = ''): float
    {
        if ($creditAmount <= 0) {
            return round($creditAmount, 2);
        }

        return DB::transaction(function () use ($invoice, $creditAmount, $note) {
            $invoice->refresh();
            $outstanding = round(
                max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount),
                2
            );

            if ($outstanding <= 0) {
                return round($creditAmount, 2);
            }

            $apply = round(min($creditAmount, $outstanding), 2);
            $newPaid = round((float) $invoice->paid_amount + $apply, 2);

            if ($newPaid + 0.001 >= (float) $invoice->total_amount) {
                if ($note) {
                    $invoice->status_history_note = $note;
                }
                $invoice->update([
                    'paid_amount' => $invoice->total_amount,
                    'status' => 'PAID',
                ]);
            } else {
                if ($note) {
                    $invoice->status_history_note = $note;
                }
                $invoice->update([
                    'paid_amount' => $newPaid,
                    'status' => 'PARTIAL',
                ]);
            }

            return round($creditAmount - $apply, 2);
        });
    }

    /**
     * HÃƒÂ¡Ã‚Â»Ã‚Â§y hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n: * ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ CANCELLED (trÃƒÂ¡Ã‚Â»Ã‚Â« PAID).
     * Ghi nhÃƒÂ¡Ã‚ÂºÃ‚Â­n cancelled_at vÃƒÆ’Ã‚Â  lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i.
     */
    public function cancelInvoice(Invoice $invoice, ?string $note = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $note) {
            if ($note) {
                $invoice->status_history_note = $note;
            }

            $invoice->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
            ]);

            return $invoice->refresh();
        });
    }

    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬â€
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ  STATUS HISTORY & RECALCULATION HOOKS                 ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â£

    /**
     * TÃƒÆ’Ã‚Â­nh lÃƒÂ¡Ã‚ÂºÃ‚Â¡i total_amount tÃƒÂ¡Ã‚Â»Ã‚Â« toÃƒÆ’Ã‚Â n bÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ items + approved adjustments.
     *
     * CÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã‚Â©c:
     * Final Amount = SUM(items.amount) + SUM(approved DEBIT) - SUM(approved CREDIT)
     */
    public function recalculateTotalAmount(Invoice $invoice): void
    {
        $itemsTotal = $invoice->items()->sum('amount');

        $approvedDebits = $invoice->adjustments()
            ->where('type', 'DEBIT')
            ->whereNotNull('approved_at')
            ->sum('amount');

        $approvedCredits = $invoice->adjustments()
            ->where('type', 'CREDIT')
            ->whereNotNull('approved_at')
            ->sum('amount');

        $finalAmount = $itemsTotal + $approvedDebits - $approvedCredits;

        $invoice->update(['total_amount' => max(0, $finalAmount)]);
    }

    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬â€
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ  INITIAL INVOICE (HÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n kÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng)              ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â£

    /**
     * TÃƒÂ¡Ã‚ÂºÃ‚Â¡o hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n ban Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u khi Tenant kÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng.
     *
     * TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Invoice + Items trong transaction, tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng phÃƒÆ’Ã‚Â¡t hÃƒÆ’Ã‚Â nh (ISSUED),
     * ghi lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i.
     */
    public function createInitialInvoice(array $invoiceData, array $itemsData): Invoice
    {
        return DB::transaction(function () use ($invoiceData, $itemsData) {
            // 1. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o invoice vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi status DRAFT tÃƒÂ¡Ã‚ÂºÃ‚Â¡m thÃƒÂ¡Ã‚Â»Ã‚Âi
            $invoiceData['status'] = 'DRAFT';
            $invoice = Invoice::create($invoiceData);

            // 2. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o cÃƒÆ’Ã‚Â¡c dÃƒÆ’Ã‚Â²ng chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t (items)
            $totalAmount = 0;
            foreach ($itemsData as $item) {
                $item['org_id'] = $invoiceData['org_id'];
                $created = $invoice->items()->create($item);
                $totalAmount += $created->amount;
            }

            // 3. CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t tÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢ng tiÃƒÂ¡Ã‚Â»Ã‚Ân
            $invoice->update(['total_amount' => $totalAmount]);

            // 4. TÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng phÃƒÆ’Ã‚Â¡t hÃƒÆ’Ã‚Â nh (DRAFT ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ISSUED)
            $invoice->update([
                'status' => 'ISSUED',
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => $invoiceData['created_by_user_id'],
            ]);

            $this->recordStatusHistory($invoice, 'DRAFT', 'ISSUED', 'HÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n ban Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng phÃƒÆ’Ã‚Â¡t hÃƒÆ’Ã‚Â nh khi Tenant kÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng.');

            $invoice->load('items');
            $this->dispatchInvoiceGeneratedSafely($invoice);

            return $invoice;
        });
    }

    /**
     * TÃƒÂ¡Ã‚ÂºÃ‚Â¡o hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n thanh lÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng.
     *
     * TÃƒÂ¡Ã‚ÂºÃ‚Â¡o Invoice + Items trong transaction, tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng phÃƒÆ’Ã‚Â¡t hÃƒÆ’Ã‚Â nh (ISSUED),
     * ghi lÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch sÃƒÂ¡Ã‚Â»Ã‚Â­ trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i.
     */
    public function createTerminationInvoice(array $invoiceData, array $itemsData): Invoice
    {
        return DB::transaction(function () use ($invoiceData, $itemsData) {
            // 1. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o invoice vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi status DRAFT tÃƒÂ¡Ã‚ÂºÃ‚Â¡m thÃƒÂ¡Ã‚Â»Ã‚Âi
            $invoiceData['status'] = 'DRAFT';
            $invoice = Invoice::create($invoiceData);

            // 2. TÃƒÂ¡Ã‚ÂºÃ‚Â¡o cÃƒÆ’Ã‚Â¡c dÃƒÆ’Ã‚Â²ng chi tiÃƒÂ¡Ã‚ÂºÃ‚Â¿t (items)
            $totalAmount = 0;
            foreach ($itemsData as $item) {
                $item['org_id'] = $invoiceData['org_id'];
                $created = $invoice->items()->create($item);
                $totalAmount += $created->amount;
            }

            // 3. CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t tÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢ng tiÃƒÂ¡Ã‚Â»Ã‚Ân
            $invoice->update(['total_amount' => $totalAmount]);

            // 4. NÃƒÂ¡Ã‚ÂºÃ‚Â¿u bÃƒÂ¡Ã‚ÂºÃ‚Â±ng 0 thÃƒÆ’Ã‚Â¬ chuyÃƒÂ¡Ã‚Â»Ã†â€™n luÃƒÆ’Ã‚Â´n thÃƒÆ’Ã‚Â nh PAID
            $finalStatus = $totalAmount <= 0 ? 'PAID' : 'ISSUED';

            $invoice->update([
                'status' => $finalStatus,
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => $invoiceData['created_by_user_id'] ?? null,
                'paid_amount' => $finalStatus === 'PAID' ? $totalAmount : 0,
            ]);

            $this->recordStatusHistory($invoice, 'DRAFT', $finalStatus, 'HÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n thanh lÃƒÆ’Ã‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng ghi nhÃƒÂ¡Ã‚ÂºÃ‚Â­n cÃƒÆ’Ã‚Â¡c khoÃƒÂ¡Ã‚ÂºÃ‚Â£n chÃƒâ€ Ã‚Â°a thanh toÃƒÆ’Ã‚Â¡n cuÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi cÃƒÆ’Ã‚Â¹ng.');

            $invoice->load('items');
            $this->dispatchInvoiceGeneratedSafely($invoice);

            return $invoice;
        });
    }

    /**
     * Hook: KÃƒÆ’Ã‚Â­ch hoÃƒÂ¡Ã‚ÂºÃ‚Â¡t hÃƒÂ¡Ã‚Â»Ã‚Â£p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“ng khi Initial Invoice Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c thanh toÃƒÆ’Ã‚Â¡n.
     *
     * KiÃƒÂ¡Ã‚Â»Ã†â€™m tra `snapshot.is_initial` Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â¡c Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh hÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n ban Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u.
     * ChÃƒÂ¡Ã‚Â»Ã¢â‚¬Â° kÃƒÆ’Ã‚Â­ch hoÃƒÂ¡Ã‚ÂºÃ‚Â¡t nÃƒÂ¡Ã‚ÂºÃ‚Â¿u contract Ãƒâ€žÃ¢â‚¬Ëœang ÃƒÂ¡Ã‚Â»Ã…Â¸ trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i PENDING_PAYMENT.
     */
    private function activateContractIfInitialInvoice(Invoice $invoice): void
    {
        $snapshot = $invoice->snapshot;

        $isInitial = is_array($snapshot) && ($snapshot['is_initial'] ?? false) === true;

        if (! $isInitial) {
            return;
        }

        $contract = $invoice->contract;

        if (! $contract || $contract->status !== ContractStatus::PENDING_PAYMENT) {
            return;
        }

        $contract->update([
            'status' => ContractStatus::ACTIVE,
            'signed_at' => $contract->signed_at ?? now(),
            'activated_at' => now(),
        ]);

        // CÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i phÃƒÆ’Ã‚Â²ng thÃƒÆ’Ã‚Â nh OCCUPIED
        if ($contract->room) {
            $contract->room->update(['status' => 'occupied']);
        }
    }
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ  PAYMENT OPERATIONS                                     ÃƒÂ¢Ã¢â‚¬Â¢Ã¢â‚¬Ëœ
    // ÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â ÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚ÂÃƒÂ¢Ã¢â‚¬Â¢Ã‚Â£

    /**
     * Record a payment for an invoice.
     */
    public function recordPayment(Invoice $invoice, array $data): Payment
    {
        /** @var PaymentService $paymentService */
        $paymentService = app(PaymentService::class);

        $paymentData = [
            'org_id' => $invoice->org_id,
            'property_id' => $invoice->property_id,
            'payer_user_id' => $data['payer_user_id'] ?? $invoice->payer_user_id ?? null,
            'method' => $data['method'] ?? 'CASH',
            'amount' => $data['amount'],
            'reference' => $data['reference'] ?? null,
            'received_at' => $data['received_at'] ?? now(),
            'note' => $data['note'] ?? null,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => $data['amount']],
            ],
        ];

        $user = request()->user() ?: ($invoice->createdBy ?: User::first());

        return $paymentService->create($paymentData, $user);
    }

    /**
     * Trigger monthly billing for a property.
     * Generates invoices for all rooms with ACTIVE contracts.
     */
    public function createMonthlyInvoicesForProperty(Property $property, array $options = []): int
    {
        $count = 0;
        $contracts = $property->contracts()
            ->where('status', ContractStatus::ACTIVE->value)
            ->get();

        $billingDate = $options['billing_date'] ?? now()->toDateString();

        foreach ($contracts as $contract) {
            try {
                $result = $this->generateForContract($contract, $billingDate);
                if ($result['is_new']) {
                    $count++;
                }
            } catch (\Exception $e) {
                Log::error("Failed to generate invoice for contract {$contract->id}: ".$e->getMessage());
            }
        }

        return $count;
    }

    /**
     * Generate an invoice for a specific contract for a given billing month.
     */
    public function generateForContract(Contract $contract, string $billingDate): array
    {
        return DB::transaction(function () use ($contract, $billingDate) {
            $billingDateObj = Carbon::parse($billingDate);
            $periodStart = $billingDateObj->copy()->startOfMonth();
            $periodEnd = $billingDateObj->copy()->endOfMonth();

            // Check if an invoice already exists for this period
            $existing = Invoice::where('contract_id', $contract->id)
                ->where('period_start', $periodStart->toDateString())
                ->where('period_end', $periodEnd->toDateString())
                ->whereIn('status', ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'])
                ->first();

            if ($existing) {
                return ['invoice' => $existing, 'is_new' => false];
            }

            // Create Invoice
            $invoice = Invoice::create([
                'org_id' => $contract->org_id,
                'property_id' => $contract->property_id,
                'room_id' => $contract->room_id,
                'contract_id' => $contract->id,
                'status' => 'DRAFT',
                'period_start' => $periodStart,
                'period_end' => $periodEnd,
                'due_date' => $billingDateObj->copy()->addDays($contract->property->default_due_day ?? 5),
                'total_amount' => 0,
                'created_by_user_id' => request()->user()?->id,
            ]);

            $totalAmount = 0;

            // 1. Rent Item
            if ($contract->rent_price > 0) {
                $rentItem = $invoice->items()->create([
                    'org_id' => $contract->org_id,
                    'type' => 'RENT',
                    'name' => 'TiÃƒÂ¡Ã‚Â»Ã‚Ân phÃƒÆ’Ã‚Â²ng',
                    'description' => 'TiÃƒÂ¡Ã‚Â»Ã‚Ân phÃƒÆ’Ã‚Â²ng thÃƒÆ’Ã‚Â¡ng '.$billingDateObj->format('m/Y'),
                    'quantity' => 1,
                    'unit_price' => $contract->rent_price,
                    'amount' => $contract->rent_price,
                ]);
                $totalAmount += $rentItem->amount;
            }

            // 2. Fixed Services
            if ($contract->fixed_services_fee > 0) {
                $serviceItem = $invoice->items()->create([
                    'org_id' => $contract->org_id,
                    'type' => 'SERVICE',
                    'name' => 'PhÃƒÆ’Ã‚Â­ dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch vÃƒÂ¡Ã‚Â»Ã‚Â¥ cÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹nh',
                    'description' => 'PhÃƒÆ’Ã‚Â­ dÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹ch vÃƒÂ¡Ã‚Â»Ã‚Â¥ thÃƒÆ’Ã‚Â¡ng '.$billingDateObj->format('m/Y'),
                    'quantity' => 1,
                    'unit_price' => $contract->fixed_services_fee,
                    'amount' => $contract->fixed_services_fee,
                ]);
                $totalAmount += $serviceItem->amount;
            }

            $invoice->update([
                'total_amount' => $totalAmount,
                'status' => 'ISSUED',
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => request()->user()?->id,
            ]);

            $this->recordStatusHistory($invoice, 'DRAFT', 'ISSUED', 'HÃƒÆ’Ã‚Â³a Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â¡n thÃƒÆ’Ã‚Â¡ng tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ng tÃƒÂ¡Ã‚ÂºÃ‚Â¡o.');

            $invoice->load('items');
            $this->dispatchInvoiceGeneratedSafely($invoice);

            return ['invoice' => $invoice, 'is_new' => true];
        });
    }

    /**
     * Ghi lại lịch sử thay đổi trạng thái hóa đơn.
     */
    private function recordStatusHistory(Invoice $invoice, ?string $from, string $to, ?string $note = null): void
    {
        $invoice->statusHistories()->create([
            'org_id' => $invoice->org_id,
            'from_status' => $from,
            'to_status' => $to,
            'note' => $note ?? $invoice->status_history_note,
            'changed_by_user_id' => request()->user()?->id ?? $invoice->created_by_user_id,
        ]);
    }

    /**
     * Broadcast/listener failures must not break core billing flow.
     */
    private function dispatchInvoiceGeneratedSafely(Invoice $invoice): void
    {
        try {
            event(new InvoiceGenerated($invoice));
        } catch (\Throwable $e) {
            Log::warning('invoice_generated_event_dispatch_failed', [
                'invoice_id' => $invoice->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
