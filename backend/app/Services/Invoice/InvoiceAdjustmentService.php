<?php

namespace App\Services\Invoice;

use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceAdjustment;
use App\Models\Org\User;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

class InvoiceAdjustmentService
{
    public function __construct(protected InvoiceService $invoiceService)
    {
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ OPERATIONS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách adjustments của 1 hóa đơn (pagination).
     */
    public function paginateByInvoice(
        Invoice $invoice,
        int $perPage = 15
    ) {
        $query = QueryBuilder::for(
            InvoiceAdjustment::where('invoice_id', $invoice->id)
        )
            ->allowedFilters([
                AllowedFilter::exact('type'),
            ])
            ->allowedSorts(['created_at', 'amount', 'type'])
            ->defaultSort('-created_at')
            ->with(['createdBy', 'approvedBy']);

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Tìm 1 adjustment theo ID.
     */
    public function find(string $id): ?InvoiceAdjustment
    {
        return InvoiceAdjustment::with(['invoice', 'createdBy', 'approvedBy'])->find($id);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  WRITE OPERATIONS                                     ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo khoản điều chỉnh cho hóa đơn.
     *
     * Business rules:
     * - Chỉ tạo adjustment cho hóa đơn có status: ISSUED hoặc PENDING.
     * - Tenant không được gọi (kiểm tra ở Policy).
     * - Trạng thái mặc định: chưa duyệt (approved_at = null).
     */
    public function createAdjustment(Invoice $invoice, array $data, User $user): InvoiceAdjustment
    {
        // Validate: chỉ cho phép adjustment trên hóa đơn ISSUED hoặc PENDING
        if (!in_array($invoice->status, ['ISSUED', 'PENDING'])) {
            abort(422, 'Chỉ có thể tạo khoản điều chỉnh cho hóa đơn ở trạng thái Đã phát hành (ISSUED) hoặc Chờ thanh toán (PENDING).');
        }

        return InvoiceAdjustment::create([
            'org_id' => $invoice->org_id,
            'invoice_id' => $invoice->id,
            'type' => $data['type'],
            'amount' => $data['amount'],
            'reason' => $data['reason'],
            'created_by_user_id' => $user->id,
        ]);
    }

    /**
     * Duyệt khoản điều chỉnh & cập nhật lại total_amount hóa đơn.
     *
     * Business rules:
     * - Set approved_by_user_id và approved_at.
     * - Gọi recalculateTotalAmount để tính lại tổng tiền.
     */
    public function approveAdjustment(InvoiceAdjustment $adjustment, User $approver): InvoiceAdjustment
    {
        if ($adjustment->isApproved()) {
            abort(422, 'Khoản điều chỉnh này đã được duyệt trước đó.');
        }

        return DB::transaction(function () use ($adjustment, $approver) {
            $adjustment->update([
                'approved_by_user_id' => $approver->id,
                'approved_at' => now(),
            ]);

            // Hook: Tính lại total_amount hóa đơn
            $this->invoiceService->recalculateTotalAmount($adjustment->invoice);

            return $adjustment->refresh()->load(['createdBy', 'approvedBy']);
        });
    }

    /**
     * Xóa khoản điều chỉnh (chỉ cho xóa nếu chưa duyệt).
     */
    public function deleteAdjustment(InvoiceAdjustment $adjustment): bool
    {
        if ($adjustment->isApproved()) {
            abort(422, 'Không thể xóa khoản điều chỉnh đã được duyệt. Vui lòng tạo khoản điều chỉnh đảo ngược.');
        }

        return $adjustment->delete();
    }
}
