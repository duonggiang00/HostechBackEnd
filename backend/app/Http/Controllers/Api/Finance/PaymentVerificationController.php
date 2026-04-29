<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\PaymentResource;
use App\Models\Finance\Payment;
use App\Models\Invoice\Invoice;
use App\Services\Finance\PaymentService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/**
 * Xét duyệt bằng chứng thanh toán (Payment Verification)
 *
 * Owner/Manager/Staff xem và phê duyệt các giao dịch PENDING do Tenant gửi (Staff: theo `FinancePolicy::update`).
 */
#[Group('Tài chính – Xét duyệt thanh toán')]
class PaymentVerificationController extends Controller
{
    public function __construct(protected PaymentService $service) {}

    /**
     * Danh sách giao dịch cần xét duyệt
     *
     * Lấy tất cả Payment ở trạng thái PENDING do tenant gửi (meta.submitted_by_tenant = true).
     * Hỗ trợ lọc theo property_id.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Payment::class);

        $user = $request->user();

        $query = Payment::with(['property', 'payer', 'allocations.invoice', 'receipt', 'proofReceipt'])
            ->where('status', 'PENDING')
            ->whereJsonContains('meta->submitted_by_tenant', true)
            ->orderByDesc('created_at');

        // Scope theo org
        $orgId = $user->hasRole('Admin')
            ? $request->input('org_id')
            : $user->org_id;

        if ($orgId) {
            $query->where('org_id', $orgId);
        }

        // Filter by property
        if ($request->filled('property_id')) {
            $query->where('property_id', $request->input('property_id'));
        }

        // Manager/Staff chỉ thấy payments thuộc property được giao
        if ($user->hasRole(['Manager', 'Staff'])) {
            $query->whereHas('property.managers', fn ($q) => $q->where('user_id', $user->id));
        }

        return PaymentResource::collection(
            $query->paginate((int) $request->input('per_page', 20))
        );
    }

    /**
     * Duyệt bằng chứng thanh toán
     *
     * Xác nhận giao dịch PENDING: đổi status → APPROVED, gạch nợ hóa đơn,
     * tự động chuyển hóa đơn sang PAID nếu đủ tiền.
     *
     * @urlParam id uuid required ID của Payment cần duyệt
     *
     * @bodyParam note string Ghi chú khi duyệt
     */
    public function approve(Request $request, string $id): JsonResponse
    {
        $payment = $this->service->find($id);

        if (! $payment) {
            abort(404, 'Payment Not Found');
        }

        $this->authorize('update', $payment);

        if ($payment->status !== 'PENDING') {
            abort(422, 'Chỉ có thể duyệt giao dịch đang ở trạng thái Chờ xác nhận (PENDING).');
        }

        $note = $request->input('note');
        if ($note) {
            $payment->update(['note' => trim($payment->note."\n[Manager] ".$note)]);
        }

        $approved = $this->service->approvePending($payment, $request->user());

        return response()->json([
            'message' => 'Giao dịch đã được duyệt. Hóa đơn đã được cập nhật.',
            'data' => new PaymentResource($approved->load(['property', 'payer', 'allocations.invoice', 'receipt', 'proofReceipt'])),
        ]);
    }

    /**
     * Từ chối bằng chứng thanh toán
     *
     * Đổi trạng thái giao dịch PENDING → REJECTED.
     * Hóa đơn giữ nguyên trạng thái (chưa bị gạch nợ).
     *
     * @urlParam id uuid required ID của Payment cần từ chối
     *
     * @bodyParam reason string required Lý do từ chối
     */
    public function reject(Request $request, string $id): JsonResponse
    {
        $payment = $this->service->find($id);

        if (! $payment) {
            abort(404, 'Payment Not Found');
        }

        $this->authorize('update', $payment);

        if ($payment->status !== 'PENDING') {
            abort(422, 'Chỉ có thể từ chối giao dịch đang ở trạng thái Chờ xác nhận (PENDING).');
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $reviews = $payment->meta['invoice_review'] ?? [];

        DB::transaction(function () use ($payment, $validated, $request, $reviews) {
            $payment->update([
                'status' => 'REJECTED',
                'note' => trim(($payment->note ?? '')."\n[Từ chối] ".$validated['reason']),
                'meta' => array_merge($payment->meta ?? [], [
                    'rejected_by' => $request->user()->id,
                    'rejected_at' => now()->toIso8601String(),
                    'reject_reason' => $validated['reason'],
                ]),
            ]);
            foreach ($reviews as $row) {
                $invId = $row['invoice_id'] ?? null;
                $prev = $row['previous_status'] ?? null;
                if (! $invId || ! $prev) {
                    continue;
                }
                $invoice = Invoice::query()->find($invId);
                if (! $invoice || $invoice->status !== 'PENDING') {
                    continue;
                }
                $invoice->status_history_note = 'Từ chối bằng chứng thanh toán — khôi phục trạng thái trước khi gửi.';
                $invoice->update(['status' => $prev]);
            }
        });

        return response()->json([
            'message' => 'Đã từ chối giao dịch. Tenant sẽ được thông báo.',
            'data' => new PaymentResource($payment->fresh(['property', 'payer', 'allocations.invoice', 'receipt', 'proofReceipt'])),
        ]);
    }
}
