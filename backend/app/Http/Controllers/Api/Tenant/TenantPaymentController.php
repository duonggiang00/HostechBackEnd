<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\PaymentResource;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentAllocation;
use App\Models\Finance\Receipt;
use App\Models\Invoice\Invoice;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;

/**
 * Tenant – Gửi bằng chứng thanh toán thủ công
 *
 * Cho phép cư dân (Tenant) gửi ảnh bằng chứng thanh toán (tiền mặt / chuyển khoản)
 * để chờ Manager/Staff xác nhận.
 */
class TenantPaymentController extends Controller
{
    /**
     * Danh sách giao dịch của Tenant hiện tại
     *
     * Trả về toàn bộ Payment mà payer_user_id = user đang đăng nhập,
     * bao gồm cả PENDING (chờ duyệt).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $payments = Payment::with(['property', 'allocations.invoice', 'receipt', 'proofReceipt'])
            ->where('payer_user_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate((int) $request->input('per_page', 15));

        return PaymentResource::collection($payments);
    }

    /**
     * Gửi bằng chứng thanh toán thủ công
     *
     * Tenant chụp ảnh chứng từ (tiền mặt / chuyển khoản) và gửi lên.
     * Hệ thống tạo Payment ở trạng thái PENDING, lưu ảnh vào receipts (kind=PROOF),
     * chuyển hóa đơn sang PENDING để quản lý biết đang chờ đối soát.
     *
     * @bodyParam invoice_id  uuid required ID hóa đơn cần thanh toán
     * @bodyParam method      string required Phương thức: CASH | TRANSFER | BANK_TRANSFER (BANK_TRANSFER lưu thành TRANSFER)
     * @bodyParam amount      numeric required Số tiền muốn trả
     * @bodyParam reference   string Số tham chiếu / mã giao dịch ngân hàng
     * @bodyParam note        string Ghi chú thêm
     * @bodyParam proof_image file required Image file (jpg/png/webp, max 5MB)
     */
    public function submitProof(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'invoice_id' => ['required', 'uuid', 'exists:invoices,id'],
            'method' => ['required', 'string', 'in:CASH,TRANSFER,BANK_TRANSFER'],
            'amount' => ['required', 'numeric', 'min:1'],
            'reference' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:1000'],
            'proof_image' => ['required', 'file', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
        ]);

        $invoice = Invoice::with('contract.members')->find($validated['invoice_id']);

        if (! $invoice) {
            abort(404, 'Hóa đơn không tồn tại.');
        }

        $isTenantOf = $invoice->payer_user_id === $user->id
            || ($invoice->contract && $invoice->contract->members()
                ->where('user_id', $user->id)
                ->exists());

        if (! $isTenantOf) {
            abort(403, 'Bạn không có quyền gửi bằng chứng thanh toán cho hóa đơn này.');
        }

        if (! in_array($invoice->status, ['ISSUED', 'PARTIAL', 'OVERDUE', 'LATE'], true)) {
            abort(422, 'Hóa đơn này không ở trạng thái cần thanh toán hoặc đang chờ xác minh.');
        }

        $outstanding = (float) $invoice->total_amount - (float) $invoice->paid_amount;
        if ($validated['amount'] > $outstanding + 0.01) {
            abort(422, "Số tiền gửi ({$validated['amount']}) vượt quá số tiền còn lại ({$outstanding}).");
        }

        $methodStored = in_array($validated['method'], ['BANK_TRANSFER', 'TRANSFER'], true)
            ? 'TRANSFER'
            : 'CASH';

        return DB::transaction(function () use ($validated, $invoice, $user, $request, $methodStored) {
            $previousStatus = $invoice->status;

            $payment = Payment::create([
                'org_id' => $invoice->org_id,
                'property_id' => $invoice->property_id,
                'payer_user_id' => $user->id,
                'received_by_user_id' => $user->id,
                'method' => $methodStored,
                'amount' => $validated['amount'],
                'reference' => $validated['reference'] ?? null,
                'received_at' => null,
                'status' => 'PENDING',
                'note' => $validated['note'] ?? null,
                'meta' => [
                    'submitted_by_tenant' => true,
                    'submitted_at' => now()->toIso8601String(),
                    'invoice_review' => [
                        [
                            'invoice_id' => $invoice->id,
                            'previous_status' => $previousStatus,
                        ],
                    ],
                ],
            ]);

            PaymentAllocation::create([
                'org_id' => $invoice->org_id,
                'payment_id' => $payment->id,
                'invoice_id' => $invoice->id,
                'amount' => $validated['amount'],
            ]);

            $file = $request->file('proof_image');
            $path = $file->store("payment-proofs/{$invoice->org_id}", 'public');

            Receipt::create([
                'org_id' => $invoice->org_id,
                'payment_id' => $payment->id,
                'kind' => Receipt::KIND_PROOF,
                'path' => $path,
                'sha256' => hash_file('sha256', $file->getRealPath()),
            ]);

            $invoice->status_history_note = 'Chờ quản lý xác minh bằng chứng thanh toán từ cư dân.';
            $invoice->update(['status' => 'PENDING']);

            return response()->json([
                'message' => 'Bằng chứng thanh toán đã được gửi. Vui lòng chờ quản lý xác nhận.',
                'data' => new PaymentResource($payment->load(['allocations.invoice', 'receipt', 'proofReceipt'])),
            ], 201);
        });
    }
}
