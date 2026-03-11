<?php

namespace App\Services\Invoice;

use App\Enums\ContractStatus;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Models\Invoice\InvoiceStatusHistory;
use App\Models\Property\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class InvoiceService
{
    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ OPERATIONS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách hóa đơn (pagination + filter + sort + search).
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
        $orgId = $orgId ?? ($user?->hasRole('Admin') ? request()->input('org_id') : $user?->org_id);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('contract', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
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

        // Tìm kiếm theo mã phòng hoặc tên property
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
        $orgId = $orgId ?? ($user?->hasRole('Admin') ? request()->input('org_id') : $user?->org_id);

        if ($orgId) {
            $query->where('org_id', $orgId);
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
     * Danh sách hóa đơn theo Tòa nhà (Property).
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
        $orgId = $orgId ?? ($user?->hasRole('Admin') ? request()->input('org_id') : $user?->org_id);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($user && $user->hasRole('Tenant')) {
            $query->whereHas('contract', function ($q) use ($user) {
                $q->where('status', 'ACTIVE')
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
     * Danh sách hóa đơn theo Tầng (Floor) trong Tòa nhà.
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
        $orgId = $orgId ?? ($user?->hasRole('Admin') ? request()->input('org_id') : $user?->org_id);

        if ($orgId) {
            $query->where('org_id', $orgId);
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
     * Tìm 1 hóa đơn theo ID (kèm eager load).
     */
    public function find(string $id): ?Invoice
    {
        return Invoice::with([
            'property',
            'room',
            'contract',
            'items',
            'createdBy',
            'issuedBy',
            'statusHistories.changedBy',
            'adjustments.createdBy',
            'adjustments.approvedBy',
        ])->find($id);
    }

    /**
     * Tìm hóa đơn đã xóa mềm.
     */
    public function findTrashed(string $id): ?Invoice
    {
        return Invoice::onlyTrashed()->with(['property', 'room'])->find($id);
    }

    /**
     * Tìm kể cả đã xóa mềm.
     */
    public function findWithTrashed(string $id): ?Invoice
    {
        return Invoice::withTrashed()->with(['property', 'room'])->find($id);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  WRITE OPERATIONS                                     ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo hóa đơn mới kèm danh sách items.
     *
     * Sử dụng DB::transaction để đảm bảo tính toàn vẹn:
     * - Tạo Invoice
     * - Tạo các InvoiceItem
     * - Tính tổng total_amount từ các items
     */
    public function create(array $data, array $itemsData = []): Invoice
    {
        $user = request()->user();

        // Auto-assign org_id if not explicitly provided or by non-admin
        if ($user && ! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } else {
            // Admin: lấy org_id từ room nếu không truyền
            if (! isset($data['org_id'])) {
                $room = Room::find($data['room_id'] ?? null);
                $data['org_id'] = $room?->org_id;
            }
        }
        $data['created_by_user_id'] = $user?->id;

        return DB::transaction(function () use ($data, $itemsData) {
            // 1. Tạo hóa đơn gốc
            $invoice = Invoice::create($data);

            // 2. Tạo các dòng chi tiết (items)
            $totalAmount = 0;
            foreach ($itemsData as $item) {
                $item['org_id'] = $data['org_id'];
                $created = $invoice->items()->create($item);
                $totalAmount += $created->amount;
            }

            // 3. Cập nhật tổng tiền
            if ($totalAmount > 0) {
                $invoice->update(['total_amount' => $totalAmount]);
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

    // ╔═══════════════════════════════════════════════════════╗
    // ║  INVOICE ITEMS OPERATIONS                             ║
    // ╠═══════════════════════════════════════════════════════╣

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

    // ╔═══════════════════════════════════════════════════════╗
    // ║  STATUS TRANSITIONS                                   ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Phát hành hóa đơn: DRAFT → ISSUED.
     * Ghi nhận issue_date, issued_at, issued_by_user_id và lịch sử trạng thái.
     */
    public function issueInvoice(Invoice $invoice, ?string $issuedByUserId = null, ?string $note = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $issuedByUserId, $note) {
            $oldStatus = $invoice->status;

            $invoice->update([
                'status' => 'ISSUED',
                'issue_date' => now(),
                'issued_at' => now(),
                'issued_by_user_id' => $issuedByUserId,
            ]);

            $this->recordStatusHistory($invoice, $oldStatus, 'ISSUED', $note);

            return $invoice->refresh();
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
            $oldStatus = $invoice->status;

            $invoice->update([
                'status' => 'PAID',
                'paid_amount' => $invoice->total_amount,
            ]);

            $this->recordStatusHistory($invoice, $oldStatus, 'PAID', $note);

            // Hook: Kích hoạt hợp đồng nếu là hóa đơn ban đầu
            $this->activateContractIfInitialInvoice($invoice);

            return $invoice->refresh();
        });
    }

    /**
     * Hủy hóa đơn: * → CANCELLED (trừ PAID).
     * Ghi nhận cancelled_at và lịch sử trạng thái.
     */
    public function cancelInvoice(Invoice $invoice, ?string $note = null): Invoice
    {
        return DB::transaction(function () use ($invoice, $note) {
            $oldStatus = $invoice->status;

            $invoice->update([
                'status' => 'CANCELLED',
                'cancelled_at' => now(),
            ]);

            $this->recordStatusHistory($invoice, $oldStatus, 'CANCELLED', $note);

            return $invoice->refresh();
        });
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  STATUS HISTORY & RECALCULATION HOOKS                 ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Ghi lịch sử thay đổi trạng thái hóa đơn.
     */
    private function recordStatusHistory(
        Invoice $invoice,
        ?string $oldStatus,
        string $newStatus,
        ?string $note = null
    ): InvoiceStatusHistory {
        return InvoiceStatusHistory::create([
            'org_id' => $invoice->org_id,
            'invoice_id' => $invoice->id,
            'from_status' => $oldStatus,
            'to_status' => $newStatus,
            'note' => $note,
            'changed_by_user_id' => request()->user()?->id,
        ]);
    }

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

    // ╔═══════════════════════════════════════════════════════╗
    // ║  INITIAL INVOICE (Hóa đơn ký hợp đồng)              ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo hóa đơn ban đầu khi Tenant ký hợp đồng.
     *
     * Tạo Invoice + Items trong transaction, tự động phát hành (ISSUED),
     * ghi lịch sử trạng thái.
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

            $this->recordStatusHistory($invoice, 'DRAFT', 'ISSUED', 'Hóa đơn ban đầu – tự động phát hành khi Tenant ký hợp đồng.');

            return $invoice->load('items');
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

        if (! $contract || $contract->status !== ContractStatus::PENDING_PAYMENT->value) {
            return;
        }

        $contract->update([
            'status' => ContractStatus::ACTIVE->value,
            'signed_at' => now(),
        ]);
    }
}
