<?php

namespace App\Services\Invoice;

use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class InvoiceService
{
    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ OPERATIONS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách hóa đơn (pagination + filter + sort + search).
     */
    public function paginate(
        array $allowedFilters = [],
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ) {
        $query = QueryBuilder::for(Invoice::class)
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('contract_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
            ]))
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

        // Lọc theo org (non-Admin users)
        if ($orgId) {
            $query->where('org_id', $orgId);
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
        array $allowedFilters = [],
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ) {
        $query = QueryBuilder::for(Invoice::onlyTrashed())
            ->allowedFilters(array_merge($allowedFilters, [
                AllowedFilter::exact('org_id'),
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('room_id'),
                AllowedFilter::exact('status'),
            ]))
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

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->whereHas(
                    'room',
                    fn($rq) =>
                    $rq->where('code', 'like', "%{$search}%")
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
    ) {
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
     * Danh sách hóa đơn theo Tầng (Floor) trong Tòa nhà.
     */
    public function paginateByFloor(
        string $propertyId,
        string $floorId,
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ) {
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
     */
    public function update(string $id, array $data): ?Invoice
    {
        $invoice = $this->find($id);
        if (!$invoice)
            return null;

        return DB::transaction(function () use ($invoice, $data) {
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
        if (!$invoice)
            return false;
        return $invoice->delete();
    }

    /**
     * Khôi phục hóa đơn đã xóa mềm.
     */
    public function restore(string $id): bool
    {
        $invoice = $this->findTrashed($id);
        if (!$invoice)
            return false;
        return $invoice->restore();
    }

    /**
     * Xóa vĩnh viễn.
     */
    public function forceDelete(string $id): bool
    {
        $invoice = $this->findWithTrashed($id);
        if (!$invoice)
            return false;
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
            $total = $invoice->items()->sum('amount');
            $invoice->update(['total_amount' => $total]);

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
            $total = $invoice->items()->sum('amount');
            $invoice->update(['total_amount' => $total]);

            return true;
        });
    }
}