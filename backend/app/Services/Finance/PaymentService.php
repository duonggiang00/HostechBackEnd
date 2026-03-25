<?php

namespace App\Services\Finance;

use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentAllocation;
use App\Models\Invoice\Invoice;
use App\Models\Org\User;
use App\Services\Invoice\InvoiceService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class PaymentService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected LedgerService $ledgerService
    ) {
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ OPERATIONS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách payments (pagination + filter + sort + search).
     *
     * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
     * @queryParam page int Trang hiện tại. Example: 1
     * @queryParam filter[property_id] uuid Lọc theo tòa nhà.
     * @queryParam filter[status] string Lọc theo trạng thái (PENDING, APPROVED, REJECTED).
     * @queryParam filter[method] string Lọc theo phương thức (CASH, TRANSFER, WALLET, QR).
     * @queryParam search string Tìm kiếm theo reference hoặc note.
     * @queryParam sort string Sắp xếp. Example: -received_at
     */
    public function paginate(
        int $perPage = 15,
        ?string $search = null,
        ?string $orgId = null
    ): LengthAwarePaginator {
        $query = QueryBuilder::for(Payment::class)
            ->allowedFilters([
                AllowedFilter::exact('property_id'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('method'),
                AllowedFilter::exact('payer_user_id'),
            ])
            ->allowedSorts(['received_at', 'amount', 'created_at', 'status'])
            ->defaultSort('-received_at')
            ->with(['property', 'payer', 'receivedBy', 'allocations.invoice']);

        $user = request()->user();
        $orgId = $orgId ?? ($user?->hasRole('Admin') ? request()->input('org_id') : $user?->org_id);

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        // Manager/Staff: chỉ thấy payments thuộc property được giao
        if ($user && $user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', fn ($q) => $q->where('user_id', $user->id));
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                    ->orWhere('note', 'like', "%{$search}%");
            });
        }

        // Filter: received_between=YYYY-MM-DD,YYYY-MM-DD
        $receivedBetween = request()->input('filter.received_between');
        if ($receivedBetween && str_contains($receivedBetween, ',')) {
            [$from, $to] = explode(',', $receivedBetween, 2);
            $query->whereBetween('received_at', [trim($from).' 00:00:00', trim($to).' 23:59:59']);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    /**
     * Tìm 1 payment theo ID.
     */
    public function find(string $id): ?Payment
    {
        return Payment::with([
            'property',
            'payer',
            'receivedBy',
            'approvedBy',
            'allocations.invoice',
            'receipt',
        ])->find($id);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  WRITE OPERATIONS                                     ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Ghi nhận thu tiền và gạch nợ hóa đơn (Atomic Transaction).
     *
     * Quy trình:
     * 1. Validate: SUM(allocations.amount) == payment.amount
     * 2. Validate: Tất cả invoices thuộc đúng org_id
     * 3. Tạo Payment
     * 4. Tạo PaymentAllocation cho từng hóa đơn
     * 5. Cập nhật paid_amount + trạng thái từng Invoice
     * 6. Ghi bút toán sổ cái (LedgerEntry)
     */
    public function create(array $data, User $user): Payment
    {
        $allocations = $data['allocations'] ?? [];

        // Validate: Tổng allocations phải bằng payment.amount
        $totalAllocated = collect($allocations)->sum('amount');
        if (abs($totalAllocated - $data['amount']) > 0.01) {
            abort(422, "Tổng số tiền phân bổ ({$totalAllocated}) phải bằng số tiền thanh toán ({$data['amount']}).");
        }

        return DB::transaction(function () use ($data, $allocations, $user) {
            // 1. Tạo Payment
            $payment = Payment::create([
                'org_id'              => $data['org_id'],
                'property_id'         => $data['property_id'] ?? null,
                'payer_user_id'       => $data['payer_user_id'] ?? null,
                'received_by_user_id' => $user->id,
                'method'              => $data['method'],
                'amount'              => $data['amount'],
                'reference'           => $data['reference'] ?? null,
                'received_at'         => $data['received_at'] ?? now(),
                'status'              => 'APPROVED',
                'approved_by_user_id' => $user->id,
                'approved_at'         => now(),
                'note'                => $data['note'] ?? null,
                'meta'                => $data['meta'] ?? null,
            ]);

            // 2. Tạo PaymentAllocation và gạch nợ từng Invoice
            foreach ($allocations as $alloc) {
                $invoice = Invoice::find($alloc['invoice_id']);

                // Security: invoice phải thuộc cùng org
                if (! $invoice || (string) $invoice->org_id !== (string) $data['org_id']) {
                    abort(422, "Hóa đơn {$alloc['invoice_id']} không hợp lệ hoặc không thuộc tổ chức này.");
                }

                // Tạo allocation
                PaymentAllocation::create([
                    'org_id'     => $data['org_id'],
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount'     => $alloc['amount'],
                ]);

                // Gạch nợ: Cộng vào paid_amount
                $newPaidAmount = (float) $invoice->paid_amount + (float) $alloc['amount'];
                $invoice->update(['paid_amount' => $newPaidAmount]);

                // Nếu paid_amount >= total_amount → chuyển sang PAID
                if ($newPaidAmount >= (float) $invoice->total_amount) {
                    $this->invoiceService->payInvoice($invoice, "Thanh toán qua Payment #{$payment->id}");
                }
            }

            // 3. Ghi sổ cái
            $this->ledgerService->recordPayment($payment);

            return $payment->load(['property', 'allocations.invoice', 'receipt']);
        });
    }

    /**
     * Tạo Payment ở trạng thái PENDING cho luồng VNPay.
     *
     * Khác với create():
     * - status = PENDING (chưa thu tiền, chờ VNPay callback)
     * - Chưa gạch nợ hóa đơn (đợi IPN webhook xác nhận)
     * - Chưa ghi sổ cái
     *
     * Các allocations được lưu sẵn để khi IPN về chỉ cần approve.
     */
    public function createPending(array $data, User $user): Payment
    {
        $allocations = $data['allocations'] ?? [];

        // Validate: Tổng allocations phải bằng payment.amount
        $totalAllocated = collect($allocations)->sum('amount');
        if (abs($totalAllocated - $data['amount']) > 0.01) {
            abort(422, "Tổng số tiền phân bổ ({$totalAllocated}) phải bằng số tiền thanh toán ({$data['amount']}).");
        }

        return DB::transaction(function () use ($data, $allocations, $user) {
            // 1. Tạo Payment với status PENDING
            $payment = Payment::create([
                'org_id'              => $data['org_id'],
                'property_id'         => $data['property_id'] ?? null,
                'payer_user_id'       => $data['payer_user_id'] ?? null,
                'received_by_user_id' => $user->id,
                'method'              => $data['method'],
                'amount'              => $data['amount'],
                'reference'           => $data['reference'] ?? null,
                'received_at'         => null,   // Sẽ cập nhật khi IPN về
                'status'              => 'PENDING',
                'note'                => $data['note'] ?? null,
                'meta'                => $data['meta'] ?? null,
            ]);

            // 2. Lưu allocations (chưa gạch nợ — chỉ là placeholder)
            foreach ($allocations as $alloc) {
                $invoice = Invoice::find($alloc['invoice_id']);

                if (! $invoice || (string) $invoice->org_id !== (string) $data['org_id']) {
                    abort(422, "Hóa đơn {$alloc['invoice_id']} không hợp lệ hoặc không thuộc tổ chức này.");
                }

                PaymentAllocation::create([
                    'org_id'     => $data['org_id'],
                    'payment_id' => $payment->id,
                    'invoice_id' => $invoice->id,
                    'amount'     => $alloc['amount'],
                ]);
            }

            return $payment->load(['property', 'allocations.invoice']);
        });
    }

    /**
     * Approve Payment PENDING sau khi VNPay IPN xác nhận thành công.
     *
     * Quy trình:
     * 1. Đổi status → APPROVED, ghi received_at, approved_by
     * 2. Gạch nợ từng hóa đơn theo allocations đã lưu sẵn
     * 3. Ghi bút toán sổ cái
     *
     * @param  Payment   $payment  Payment đang PENDING
     * @param  User|null $approver User duyệt (thường là receivedBy)
     */
    public function approvePending(Payment $payment, ?User $approver = null): Payment
    {
        if ($payment->status !== 'PENDING') {
            abort(422, 'Chỉ có thể approve giao dịch đang PENDING.');
        }

        return DB::transaction(function () use ($payment, $approver) {
            // 1. Approve Payment
            $payment->update([
                'status'              => 'APPROVED',
                'received_at'         => now(),
                'approved_by_user_id' => $approver?->id,
                'approved_at'         => now(),
            ]);

            // 2. Gạch nợ từng hóa đơn
            foreach ($payment->allocations()->with('invoice')->get() as $alloc) {
                $invoice = $alloc->invoice;
                if (! $invoice) {
                    continue;
                }

                $newPaidAmount = (float) $invoice->paid_amount + (float) $alloc->amount;
                $invoice->update(['paid_amount' => $newPaidAmount]);

                if ($newPaidAmount >= (float) $invoice->total_amount) {
                    $this->invoiceService->payInvoice($invoice, "Thanh toán VNPay qua Payment #{$payment->id}");
                }
            }

            // 3. Ghi sổ cái
            $this->ledgerService->recordPayment($payment);

            return $payment->load(['property', 'allocations.invoice', 'receipt']);
        });
    }

    /**
     * Hủy giao dịch thanh toán (Soft delete) + Hoàn tác gạch nợ các hóa đơn.
     */
    public function void(Payment $payment): bool
    {
        if (! $payment->isApproved()) {
            abort(422, 'Chỉ có thể hủy giao dịch đã APPROVED.');
        }

        return DB::transaction(function () use ($payment) {
            // 1. Hoàn tác paid_amount trên các hóa đơn
            foreach ($payment->allocations as $alloc) {
                $invoice = $alloc->invoice;
                if (! $invoice) {
                    continue;
                }

                $newPaidAmount = max(0, (float) $invoice->paid_amount - (float) $alloc->amount);
                $invoice->update([
                    'paid_amount' => $newPaidAmount,
                    // Nếu đang PAID mà giờ chưa đủ tiền → về ISSUED
                    'status' => ($newPaidAmount < (float) $invoice->total_amount && $invoice->status === 'PAID')
                        ? 'ISSUED'
                        : $invoice->status,
                ]);
            }

            // 2. Ghi bút toán đảo ngược
            $this->ledgerService->reversePayment($payment);

            // 3. Soft delete payment
            $payment->delete();

            return true;
        });
    }
}
