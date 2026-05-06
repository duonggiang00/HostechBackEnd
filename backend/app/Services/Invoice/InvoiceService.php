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
use App\Services\Contract\ContractBillingInheritanceService;
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
    public function __construct(
        protected ContractBillingInheritanceService $billingInheritanceService
    ) {}

    // ----------------------------------------------------------------------------
    //   READ OPERATIONS
    // ----------------------------------------------------------------------------

    /**
     * Lấy tổng số tiền nợ chưa thanh toán của một hợp đồng (bao gồm các hóa đơn ISSUED, LATE, PARTIAL).
     */
    public function getUnpaidBalance(string $contractId): float
    {
        return (float) Invoice::where('contract_id', $contractId)
            ->whereIn('status', ['ISSUED', 'LATE', 'PARTIAL', 'OVERDUE'])
            ->sum('total_amount');
    }

    /**
     * Huỷ/Vô hiệu hóa toàn bộ hóa đơn chưa thanh toán của một hợp đồng (dùng khi đã gom tiền vào hóa đơn thanh lý).
     */
    public function voidUnpaidInvoicesByContract(string $contractId, string $note = ''): void
    {
        Invoice::where('contract_id', $contractId)
            ->whereIn('status', ['ISSUED', 'LATE', 'PARTIAL', 'OVERDUE'])
            ->update([
                'status' => 'CANCELLED',
                'snapshot->void_reason' => 'Đã gộp vào hóa đơn thanh lý: '.$note,
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
                AllowedFilter::callback('contract_id', function ($query, $value): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $lineageContractIds = $this->billingInheritanceService->resolveLineageContractIds((string) $value);
                    $query->whereIn('contract_id', $lineageContractIds);
                }),
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
     * Danh sách hóa đơn đã xóa mềm (thùng rác).
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
                AllowedFilter::callback('contract_id', function ($query, $value): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $lineageContractIds = $this->billingInheritanceService->resolveLineageContractIds((string) $value);
                    $query->whereIn('contract_id', $lineageContractIds);
                }),
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
                AllowedFilter::callback('contract_id', function ($query, $value): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $lineageContractIds = $this->billingInheritanceService->resolveLineageContractIds((string) $value);
                    $query->whereIn('contract_id', $lineageContractIds);
                }),
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
                AllowedFilter::callback('contract_id', function ($query, $value): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $lineageContractIds = $this->billingInheritanceService->resolveLineageContractIds((string) $value);
                    $query->whereIn('contract_id', $lineageContractIds);
                }),
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
                'contract.primaryMember.user',
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
        $data['created_by_user_id'] = $data['created_by_user_id'] ?? $user?->id;

        return DB::transaction(function () use ($data, $itemsData, $user) {
            if (($data['status'] ?? null) === 'ISSUED') {
                $now = now();
                if (empty($data['issue_date'])) {
                    $data['issue_date'] = $now->toDateString();
                }
                if (empty($data['issued_at'])) {
                    $data['issued_at'] = $now;
                }
                $issuerId = $data['issued_by_user_id'] ?? $data['created_by_user_id'] ?? $user?->id;
                if (empty($data['issued_by_user_id']) && $issuerId) {
                    $data['issued_by_user_id'] = $issuerId;
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
     * Cập nhật hóa đơn.
     * Nếu trạng thái thay đổi, tự động ghi lịch sử.
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
     * Xóa mềm hóa đơn.
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
     * Khôi phục hóa đơn đã xóa mềm.
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
     * Xóa vĩnh viễn.
     */
    public function forceDelete(string $id): bool
    {
        $invoice = $this->findWithTrashed($id);
        if (! $invoice) {
            return false;
        }

        return $invoice->forceDelete();
    }

    // ----------------------------------------------------------------------------
    //   INVOICE ITEMS OPERATIONS
    // ----------------------------------------------------------------------------

    /**
     * Thêm 1 dòng chi tiết phí vào hóa đơn.
     * Tự động cập nhật lại total_amount.
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
     * Xóa 1 dòng chi tiết khỏi hóa đơn.
     * Tự động cập nhật lại total_amount.
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

    // ----------------------------------------------------------------------------
    //   STATUS TRANSITIONS
    // ----------------------------------------------------------------------------

    /**
     * Phát hành hóa đơn: DRAFT → ISSUED.
     * Ghi nhận issue_date, issued_at, issued_by_user_id và lịch sử trạng thái.
     */
    public function issueInvoice(Invoice $invoice, ?string $issuedByUserId = null, ?string $note = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $issuedByUserId, $note) {
            // Truyền ghi chú trạng thái cho Observer
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
     * Thanh toán hóa đơn: ISSUED/PENDING → PAID.
     * Ghi nhận paid_amount = total_amount và lịch sử trạng thái.
     *
     * Nếu là Initial Invoice (hóa đơn ký hợp đồng) → tự động kích hoạt hợp đồng.
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

            // Hook: Kích hoạt hợp đồng nếu là hóa đơn ban đầu
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
     * Huỷ hóa đơn: * → CANCELLED (trừ PAID).
     * Ghi nhận cancelled_at và lịch sử trạng thái.
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

    // ----------------------------------------------------------------------------
    //   STATUS HISTORY & RECALCULATION HOOKS
    // ----------------------------------------------------------------------------

    /**
     * Tính lại total_amount từ toàn bộ items + approved adjustments.
     *
     * Công thức:
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

    /**
     * Sau khi total_amount thay đổi (điều chỉnh đã duyệt): đồng bộ paid_amount và trạng thái (PAID / PARTIAL / ISSUED).
     */
    public function syncInvoicePaidAmountAfterTotalRecalc(Invoice $invoice): void
    {
        $invoice->refresh();
        $total = round(max(0, (float) $invoice->total_amount), 2);
        $paid = round(max(0, (float) $invoice->paid_amount), 2);

        if ($paid > $total + 0.001) {
            $paid = $total;
        }

        $outstanding = round(max(0, $total - $paid), 2);

        if ($total <= 0.02) {
            $invoice->update([
                'paid_amount' => 0,
                'status' => 'PAID',
            ]);

            return;
        }

        if ($outstanding <= 0.02) {
            $invoice->update([
                'paid_amount' => $total,
                'status' => 'PAID',
            ]);

            return;
        }

        if ($paid > 0.009) {
            $invoice->update([
                'paid_amount' => $paid,
                'status' => 'PARTIAL',
            ]);

            return;
        }

        $status = in_array($invoice->status, ['OVERDUE', 'LATE'], true) ? $invoice->status : 'ISSUED';
        $invoice->update([
            'paid_amount' => $paid,
            'status' => $status,
        ]);
    }

    // ----------------------------------------------------------------------------
    //   INITIAL INVOICE (HÓA ĐƠN KÝ HỢP ĐỒNG)
    // ----------------------------------------------------------------------------

    /**
     * Tạo hóa đơn ban đầu khi Tenant ký hợp đồng.
     *
     * Tạo Invoice + Items trong transaction, tự động phát hành (ISSUED),
     * ghi lại lịch sử trạng thái.
     */
    public function createInitialInvoice(array $invoiceData, array $itemsData): Invoice
    {
        return DB::transaction(function () use ($invoiceData, $itemsData) {
            // 1. Tạo invoice với status DRAFT tạm thời
            $invoiceData['status'] = 'DRAFT';
            $invoice = Invoice::create($invoiceData);

            // 2. Tạo các dòng chi tiết (items)
            $totalAmount = 0;
            foreach ($itemsData as $item) {
                $item['org_id'] = $invoiceData['org_id'];
                $created = $invoice->items()->create($item);
                $totalAmount += $created->amount;
            }

            // 3. Cập nhật tổng tiền
            $invoice->update(['total_amount' => $totalAmount]);

            // 4. Tự động phát hành (DRAFT → ISSUED)
            $invoice->update([
                'status' => 'ISSUED',
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => $invoiceData['created_by_user_id'],
            ]);

            $this->recordStatusHistory($invoice, 'DRAFT', 'ISSUED', 'Hóa đơn ban đầu — tự động phát hành khi Tenant ký hợp đồng.');

            $invoice->load('items');
            $this->dispatchInvoiceGeneratedSafely($invoice);

            return $invoice;
        });
    }

    /**
     * Tạo hóa đơn thanh lý hợp đồng.
     *
     * Tạo Invoice + Items trong transaction, tự động phát hành (ISSUED),
     * ghi lại lịch sử trạng thái.
     */
    public function createTerminationInvoice(array $invoiceData, array $itemsData): Invoice
    {
        return DB::transaction(function () use ($invoiceData, $itemsData) {
            // 1. Tạo invoice với status DRAFT tạm thời
            $invoiceData['status'] = 'DRAFT';
            $invoice = Invoice::create($invoiceData);

            // 2. Tạo các dòng chi tiết (items)
            $totalAmount = 0;
            foreach ($itemsData as $item) {
                $item['org_id'] = $invoiceData['org_id'];
                $created = $invoice->items()->create($item);
                $totalAmount += $created->amount;
            }

            // 3. Cập nhật tổng tiền
            $invoice->update(['total_amount' => $totalAmount]);

            // 4. Nếu bằng 0 thì chuyển luôn thành PAID
            $finalStatus = $totalAmount <= 0 ? 'PAID' : 'ISSUED';

            $invoice->update([
                'status' => $finalStatus,
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => $invoiceData['created_by_user_id'] ?? null,
                'paid_amount' => $finalStatus === 'PAID' ? $totalAmount : 0,
            ]);

            $this->recordStatusHistory($invoice, 'DRAFT', $finalStatus, 'Hóa đơn thanh lý hợp đồng ghi nhận các khoản chưa thanh toán cuối cùng.');

            $invoice->load('items');
            $this->dispatchInvoiceGeneratedSafely($invoice);

            return $invoice;
        });
    }

    /**
     * Hook: Kích hoạt hợp đồng khi Initial Invoice được thanh toán.
     *
     * Kiểm tra `snapshot.is_initial` để xác định hóa đơn ban đầu.
     * Chỉ kích hoạt nếu contract đang ở trạng thái PENDING_PAYMENT.
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

        // Cập nhật trạng thái phòng thành OCCUPIED
        if ($contract->room) {
            $contract->room->update(['status' => 'occupied']);
        }
    }
    // ----------------------------------------------------------------------------
    //   PAYMENT OPERATIONS
    // ----------------------------------------------------------------------------

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
                    'name' => 'Tiền phòng',
                    'description' => 'Tiền phòng tháng '.$billingDateObj->format('m/Y'),
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
                    'name' => 'Phí dịch vụ cố định',
                    'description' => 'Phí dịch vụ tháng '.$billingDateObj->format('m/Y'),
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

            $this->recordStatusHistory($invoice, 'DRAFT', 'ISSUED', 'Hóa đơn tháng tự động tạo.');

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
