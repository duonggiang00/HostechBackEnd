<?php

namespace App\Http\Controllers\Api\Contract;

use App\Events\Finance\InvoicePaidEvent;
use App\Http\Controllers\Controller;
use App\Models\Contract\Contract;
use App\Models\Contract\FinalPaymentRequest;
use App\Models\Finance\Receipt;
use App\Services\Finance\PaymentService;
use App\Services\Finance\VNPayService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Quản lý yêu cầu thanh toán cuối cùng (Final Payment Request)
 *
 * API cho luồng kịch bản B (nợ > cọc) sau khi thanh lý hợp đồng.
 */
#[Group('Quản lý Hợp đồng')]
class FinalPaymentRequestController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected VNPayService $vnpayService,
    ) {}

    /**
     * Chi tiết yêu cầu thanh toán cuối + thông tin hóa đơn quyết toán + trạng thái nợ.
     */
    public function show(string $id): JsonResponse
    {
        $fpr = FinalPaymentRequest::query()
            ->with(['contract:id,org_id,property_id,room_id,status', 'invoice'])
            ->findOrFail($id);

        $this->authorize('view', $fpr->contract);

        $invoice = $fpr->invoice;
        $outstanding = $invoice
            ? round(max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount), 2)
            : (float) $fpr->amount_due;

        $contract = $fpr->contract;
        $contractStatus = $contract?->status instanceof \BackedEnum
            ? $contract->status->value
            : (string) $contract?->status;

        $meta = $fpr->meta ?? [];
        $supplementalMode = ! empty($meta['supplemental_invoice_id']) || ! empty($meta['termination_invoice_id']);

        return response()->json([
            'data' => [
                'id' => $fpr->id,
                'status' => $fpr->status,
                'amount_due' => (float) $fpr->amount_due,
                'outstanding' => $outstanding,
                'created_at' => $fpr->created_at?->toIso8601String(),
                'meta' => $fpr->meta,
                'supplemental_debt_invoice_mode' => $supplementalMode,
                'termination_invoice_id' => $meta['termination_invoice_id'] ?? null,
                'supplemental_invoice_id' => $meta['supplemental_invoice_id'] ?? null,
                'contract' => [
                    'id' => $contract?->id,
                    'status' => $contractStatus,
                ],
                'invoice' => $invoice ? [
                    'id' => $invoice->id,
                    'invoice_no' => $invoice->invoice_no,
                    'total_amount' => (float) $invoice->total_amount,
                    'paid_amount' => (float) $invoice->paid_amount,
                    'status' => $invoice->status,
                    'is_termination' => (bool) $invoice->is_termination,
                ] : null,
                'vnpay_configured' => $this->vnpayService->isConfigured(),
            ],
        ]);
    }

    /**
     * Tạo URL thanh toán VNPay cho FPR (Manager gửi link/QR cho khách).
     */
    public function buildPaymentUrl(Request $request, string $id): JsonResponse
    {
        $fpr = FinalPaymentRequest::query()
            ->with(['contract', 'invoice'])
            ->findOrFail($id);

        $this->authorize('update', $fpr->contract);

        if ($fpr->status !== 'PENDING') {
            return response()->json([
                'message' => 'Yêu cầu thanh toán đã được xử lý.',
            ], 422);
        }

        $invoice = $fpr->invoice;
        if (! $invoice) {
            return response()->json(['message' => 'Không tìm thấy hóa đơn quyết toán.'], 422);
        }

        $outstanding = round(max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount), 2);
        if ($outstanding <= 0.02) {
            return response()->json(['message' => 'Hóa đơn đã được thanh toán đủ.'], 422);
        }

        $this->vnpayService->assertReadyForPayment();

        $payment = $this->paymentService->createPending([
            'org_id' => $fpr->org_id,
            'property_id' => $fpr->contract?->property_id,
            'payer_user_id' => null,
            'method' => 'VNPAY',
            'amount' => $outstanding,
            'reference' => 'FPR-'.substr($fpr->id, 0, 8),
            'note' => 'Thanh toán quyết toán hợp đồng',
            'meta' => [
                'final_payment_request_id' => $fpr->id,
                'source' => 'termination_settlement',
            ],
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => $outstanding],
            ],
        ], $request->user());

        $ipAddr = $request->ip() ?? '127.0.0.1';
        $paymentUrl = $this->vnpayService->buildPaymentUrl($payment, $ipAddr);

        return response()->json([
            'data' => [
                'payment_url' => $paymentUrl,
                'payment_id' => $payment->id,
                'amount' => $outstanding,
            ],
        ]);
    }

    /**
     * Manager ghi nhận đã thu tiền mặt cho FPR — tạo Payment APPROVED + allocation.
     *
     * Sau khi Payment APPROVED, observer dispatch PaymentSuccessfullyVerified →
     * BroadcastInvoicePaidAfterPaymentVerified → InvoicePaidEvent → CheckAndResolvePendingSettlement
     * (đã đăng ký) → đóng FPR khi hết nợ; hợp đồng có thể đã TERMINATED trước đó (kịch B mới).
     */
    public function recordCashPayment(Request $request, string $id): JsonResponse
    {
        $fpr = FinalPaymentRequest::query()
            ->with(['contract', 'invoice'])
            ->findOrFail($id);

        $this->authorize('update', $fpr->contract);

        if ($fpr->status !== 'PENDING') {
            return response()->json([
                'message' => 'Yêu cầu thanh toán đã được xử lý.',
            ], 422);
        }

        $invoice = $fpr->invoice;
        if (! $invoice) {
            return response()->json(['message' => 'Không tìm thấy hóa đơn quyết toán.'], 422);
        }

        $outstanding = round(max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount), 2);
        if ($outstanding <= 0.02) {
            return response()->json(['message' => 'Hóa đơn đã được thanh toán đủ.'], 422);
        }

        $validated = $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'method' => 'nullable|string|in:CASH,BANK_TRANSFER',
            'note' => 'nullable|string|max:500',
            'proof_image' => 'required_if:method,BANK_TRANSFER|nullable|file|mimes:jpeg,jpg,png,webp|max:5120',
        ], [
            'amount.numeric' => 'Số tiền phải là số.',
            'amount.min' => 'Số tiền không được âm.',
            'method.in' => 'Phương thức chỉ chấp nhận CASH hoặc BANK_TRANSFER.',
            'proof_image.required_if' => 'Chuyển khoản bắt buộc kèm ảnh bằng chứng (biên lai / ảnh chụp màn hình).',
        ]);

        $amount = (float) ($validated['amount'] ?? $outstanding);
        if ($amount <= 0) {
            return response()->json(['message' => 'Số tiền thu phải lớn hơn 0.'], 422);
        }
        if ($amount - $outstanding > 0.02) {
            return response()->json([
                'message' => "Số tiền thu ({$amount}) lớn hơn dư nợ ({$outstanding}).",
            ], 422);
        }

        $method = $validated['method'] ?? 'CASH';
        $defaultNote = $method === 'BANK_TRANSFER'
            ? 'Thu chuyển khoản quyết toán thanh lý hợp đồng'
            : 'Thu tiền mặt quyết toán thanh lý hợp đồng';

        $payment = $this->paymentService->create([
            'org_id' => $fpr->org_id,
            'property_id' => $fpr->contract?->property_id,
            'payer_user_id' => null,
            'method' => $method,
            'amount' => $amount,
            'reference' => 'FPR-'.substr($fpr->id, 0, 8),
            'note' => $validated['note'] ?? $defaultNote,
            'meta' => [
                'final_payment_request_id' => $fpr->id,
                'source' => 'termination_settlement',
            ],
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => $amount],
            ],
        ], $request->user());

        if ($method === 'BANK_TRANSFER' && $request->hasFile('proof_image')) {
            $file = $request->file('proof_image');
            $path = $file->store("payment-proofs/{$invoice->org_id}", 'public');

            Receipt::create([
                'org_id' => $invoice->org_id,
                'payment_id' => $payment->id,
                'kind' => Receipt::KIND_PROOF,
                'path' => $path,
                'sha256' => hash_file('sha256', $file->getRealPath()),
            ]);
        }

        // PaymentObserver dispatch PaymentSuccessfullyVerified ngay khi Payment::create chạy (trước khi allocations
        // được ghi xong trong DB::transaction). Để chắc chắn chuỗi InvoicePaidEvent → CheckAndResolvePendingSettlement
        // chạy đúng (sau khi paid_amount đã commit), bắn lại InvoicePaidEvent ở đây nếu hóa đơn đã PAID.
        $invoice->refresh();
        if ($invoice->status === 'PAID') {
            InvoicePaidEvent::dispatch($invoice, $payment->id);
        }

        $fpr->refresh();
        $contract = Contract::query()->find($fpr->contract_id);
        $contractStatus = $contract?->status instanceof \BackedEnum
            ? $contract->status->value
            : (string) $contract?->status;
        $fprClosed = $fpr->status === 'SATISFIED';

        $successMessage = $method === 'BANK_TRANSFER'
            ? 'Đã ghi nhận thu chuyển khoản. Hệ thống đang đồng bộ trạng thái hợp đồng.'
            : 'Đã ghi nhận thu tiền mặt. Hệ thống đang đồng bộ trạng thái hợp đồng.';

        $proofReceiptPayload = null;
        if ($method === 'BANK_TRANSFER') {
            $payment->load('proofReceipt');
            if ($payment->proofReceipt) {
                $proofReceiptPayload = [
                    'id' => $payment->proofReceipt->id,
                    'kind' => $payment->proofReceipt->kind,
                    'url' => Storage::disk('public')->url($payment->proofReceipt->path),
                ];
            }
        }

        return response()->json([
            'message' => $successMessage,
            'data' => [
                'payment_id' => $payment->id,
                'amount' => $amount,
                'final_payment_request_status' => $fpr->status,
                'contract_status' => $contractStatus,
                'is_terminated' => $fprClosed,
                'proof_receipt' => $proofReceiptPayload,
            ],
        ]);
    }
}
