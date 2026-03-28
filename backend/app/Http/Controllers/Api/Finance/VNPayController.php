<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StorePaymentRequest;
use App\Http\Resources\Finance\PaymentResource;
use App\Models\Finance\Payment;
use App\Services\Finance\PaymentService;
use App\Services\Finance\VNPayService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tích hợp cổng thanh toán VNPay
 *
 * API tạo URL thanh toán VNPay, xử lý Return URL và IPN Webhook.
 */
#[Group('Tài chính – VNPay')]
class VNPayController extends Controller
{
    public function __construct(
        protected PaymentService $paymentService,
        protected VNPayService   $vnpayService,
    ) {}

    // ╔═══════════════════════════════════════════════════════╗
    // ║  BƯỚC 1: TẠO PAYMENT + URL CHUYỂN HƯỚNG             ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Khởi tạo giao dịch VNPay
     *
     * Tạo Payment với status=PENDING và trả về URL để redirect browser
     * sang cổng thanh toán VNPay.
     *
     * Quy trình:
     * 1. Validate & tạo Payment (status=PENDING, method=QR|WALLET)
     * 2. Build VNPay payment URL với HMAC-SHA512
     * 3. Trả về payment_url cho frontend redirect
     *
     * @bodyParam property_id uuid ID tòa nhà. Example: uuid-property
     * @bodyParam payer_user_id uuid ID người nộp tiền. Example: uuid-user
     * @bodyParam method string Required. `QR` hoặc `WALLET`. Example: QR
     * @bodyParam amount decimal Required. Tổng tiền (VNĐ). Example: 5500000
     * @bodyParam bank_code string Mã ngân hàng VNPay (để trống = hiện giao diện chọn). Example: NCB
     * @bodyParam note string Ghi chú. Example: Thanh toan phong A101 thang 3
     * @bodyParam allocations array Required. Danh sách hóa đơn gạch nợ.
     * @bodyParam allocations[].invoice_id uuid Required. ID hóa đơn.
     * @bodyParam allocations[].amount decimal Required. Số tiền gạch vào hóa đơn này.
     */
    public function createPayment(StorePaymentRequest $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $data = $request->validated();
        $user = $request->user();

        // Tự động gán org_id
        if (! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        }

        if (empty($data['org_id'])) {
            abort(422, 'Không thể xác định org_id cho giao dịch này.');
        }

        // Validate method phải là VNPay
        if (! in_array($data['method'], ['QR', 'WALLET'])) {
            abort(422, 'Phương thức phải là QR hoặc WALLET để thanh toán qua VNPay.');
        }

        $this->vnpayService->assertReadyForPayment();

        // Tạo Payment với status PENDING (chưa thu được tiền)
        $payment = $this->paymentService->createPending($data, $user);

        // Build VNPay URL
        $bankCode   = $request->input('bank_code', '');
        $ipAddr     = $request->ip() ?? '127.0.0.1';
        $paymentUrl = $this->vnpayService->buildPaymentUrl($payment, $ipAddr, $bankCode);

        Log::info('[VNPay] Created pending payment', [
            'payment_id' => $payment->id,
            'amount'     => $payment->amount,
            'user_id'    => $user->id,
        ]);

        return response()->json([
            'message'     => 'Giao dịch đã được khởi tạo. Vui lòng chuyển hướng đến VNPay để thanh toán.',
            'payment_url' => $paymentUrl,
            'data'        => new PaymentResource($payment),
        ], 201);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  BƯỚC 2a: RETURN URL (Browser Redirect)              ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xử lý Return URL từ VNPay
     *
     * VNPay redirect browser về đây sau khi khách hoàn tất thanh toán
     * (bất kể thành công hay thất bại).
     *
     * ⚠️  QUAN TRỌNG: KHÔNG nên cập nhật trạng thái tại đây —
     * dùng IPN (server-to-server) để đảm bảo tính chính xác.
     * Return URL chỉ dùng để hiển thị kết quả cho khách.
     *
     * Route: GET /api/finance/vnpay/return
     * (Frontend thường tự handle redirect; endpoint này dùng khi backend cần verify trước)
     */
    public function handleReturn(Request $request): JsonResponse
    {
        $params       = $request->query();
        $receivedHash = $request->query('vnp_SecureHash', '');

        // Verify chữ ký
        if (! $this->vnpayService->verifySignature($params, $receivedHash)) {
            Log::warning('[VNPay] Return URL: invalid signature', ['params' => $params]);
            return response()->json([
                'success' => false,
                'message' => 'Chữ ký không hợp lệ.',
            ], 400);
        }

        $data = $this->vnpayService->parseCallbackData($params);

        // Tìm Payment
        $payment = Payment::find($data['txn_ref']);
        if (! $payment) {
            return response()->json([
                'success' => false,
                'message' => 'Giao dịch không tồn tại.',
            ], 404);
        }

        return response()->json([
            'success'        => $data['success'],
            'response_code'  => $data['response_code'],
            'message'        => $this->vnpayService->getResponseMessage($data['response_code']),
            'transaction_no' => $data['transaction_no'],
            'amount'         => $data['amount'],
            'data'           => new PaymentResource($payment->load(['property', 'allocations.invoice'])),
        ]);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  BƯỚC 2b: IPN WEBHOOK (Server-to-Server)             ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xử lý IPN Webhook từ VNPay
     *
     * VNPay gọi server-to-server sau khi giao dịch hoàn tất.
     * Đây là nơi CHÍNH XÁC để cập nhật trạng thái Payment.
     *
     * Quy trình:
     * 1. Verify HMAC-SHA512 checksum
     * 2. Kiểm tra Payment tồn tại & chưa xử lý
     * 3. Kiểm tra số tiền khớp
     * 4. Nếu thành công → approve payment, gạch nợ hóa đơn
     * 5. Nếu thất bại → void payment
     * 6. Phản hồi đúng format VNPay yêu cầu
     *
     * Route: POST /api/finance/vnpay/ipn  (PUBLIC — không cần auth)
     */
    public function handleIpn(Request $request): JsonResponse
    {
        $params       = $request->all();
        $receivedHash = $params['vnp_SecureHash'] ?? '';

        Log::info('[VNPay] IPN received', ['params' => $params]);

        // ── 1. Verify checksum ──────────────────────────────────
        if (! $this->vnpayService->verifySignature($params, $receivedHash)) {
            Log::error('[VNPay] IPN: invalid checksum', ['params' => $params]);
            return response()->json(['RspCode' => '97', 'Message' => 'Invalid Checksum']);
        }

        $data = $this->vnpayService->parseCallbackData($params);

        // ── 2. Tìm Payment ──────────────────────────────────────
        /** @var Payment|null $payment */
        $payment = Payment::withTrashed()->find($data['txn_ref']);

        if (! $payment) {
            Log::error('[VNPay] IPN: payment not found', ['txn_ref' => $data['txn_ref']]);
            return response()->json(['RspCode' => '01', 'Message' => 'Order not found']);
        }

        // ── 3. Idempotency: đã xử lý IPN rồi thì bỏ qua ───────
        if ($payment->provider_ref !== null) {
            Log::info('[VNPay] IPN: already processed', ['payment_id' => $payment->id]);
            return response()->json(['RspCode' => '02', 'Message' => 'Order already confirmed']);
        }

        // ── 4. Verify số tiền khớp ──────────────────────────────
        if (abs($data['amount'] - (float) $payment->amount) > 1) {
            Log::error('[VNPay] IPN: amount mismatch', [
                'payment_id'      => $payment->id,
                'expected_amount' => $payment->amount,
                'vnpay_amount'    => $data['amount'],
            ]);
            return response()->json(['RspCode' => '04', 'Message' => 'Invalid amount']);
        }

        // ── 5. Cập nhật thông tin VNPay vào Payment ─────────────
        $payment->update([
            'provider_ref'    => $data['transaction_no'],
            'provider_status' => $data['success'] ? 'SUCCESS' : 'FAILED',
            'webhook_payload' => $data['raw'],
            'meta'            => array_merge($payment->meta ?? [], [
                'vnpay_bank_code'          => $data['bank_code'],
                'vnpay_transaction_status' => $data['transaction_status'],
                'vnpay_pay_date'           => $data['pay_date'],
            ]),
        ]);

        // ── 6. Approve hoặc Void tùy kết quả ────────────────────
        if ($data['success']) {
            // Giao dịch thành công → approve (gạch nợ hóa đơn đã được tạo khi PENDING)
            $user = $payment->receivedBy ?? $payment->payer;
            $this->paymentService->approvePending($payment, $user);

            Log::info('[VNPay] IPN: payment approved', ['payment_id' => $payment->id]);
        } else {
            // Giao dịch thất bại → void (hoàn tác allocations)
            if ($payment->isApproved()) {
                $this->paymentService->void($payment);
            } else {
                // Chỉ soft delete nếu vẫn đang PENDING
                $payment->update(['status' => 'REJECTED']);
                $payment->delete();
            }

            Log::warning('[VNPay] IPN: payment failed', [
                'payment_id'    => $payment->id,
                'response_code' => $data['response_code'],
                'message'       => $this->vnpayService->getResponseMessage($data['response_code']),
            ]);
        }

        // VNPay bắt buộc phản hồi đúng format này
        return response()->json(['RspCode' => '00', 'Message' => 'Confirm Success']);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  TIỆN ÍCH: Verify Return URL (cho Frontend)          ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Xác minh kết quả Return URL và trả trạng thái Payment
     *
     * Frontend gọi endpoint này sau khi nhận redirect từ VNPay
     * để get trạng thái chính xác từ DB (không dựa vào query params).
     *
     * @queryParam txn_ref string Required. Payment UUID (vnp_TxnRef). Example: uuid-payment
     */
    public function verifyReturn(Request $request): JsonResponse
    {
        $txnRef = $request->query('txn_ref') ?: $request->query('vnp_TxnRef');
        if (! $txnRef) {
            return response()->json(['message' => 'txn_ref is required'], 422);
        }

        $payment = Payment::withTrashed()->with(['property', 'allocations.invoice'])->find($txnRef);
        if (! $payment) {
            return response()->json(['message' => 'Giao dịch không tồn tại.'], 404);
        }

        $params = $request->query();
        $receivedHash = $request->query('vnp_SecureHash', '');
        $hasSignedCallback = isset($params['vnp_TxnRef'], $params['vnp_SecureHash']);

        if ($hasSignedCallback && $payment->provider_ref === null && $this->vnpayService->shouldTrustReturnAsIpn()) {
            if (! $this->vnpayService->verifySignature($params, $receivedHash)) {
                return response()->json(['message' => 'Chữ ký không hợp lệ.'], 400);
            }

            $data = $this->vnpayService->parseCallbackData($params);
            if ($data['txn_ref'] !== $payment->id) {
                return response()->json(['message' => 'Mã giao dịch VNPay không khớp với payment hiện tại.'], 422);
            }

            if (abs($data['amount'] - (float) $payment->amount) > 1) {
                return response()->json(['message' => 'Số tiền VNPay trả về không khớp với payment.'], 422);
            }

            $payment->update([
                'provider_ref'    => $data['transaction_no'],
                'provider_status' => $data['success'] ? 'SUCCESS' : 'FAILED',
                'webhook_payload' => $data['raw'],
                'meta'            => array_merge($payment->meta ?? [], [
                    'vnpay_bank_code'          => $data['bank_code'],
                    'vnpay_transaction_status' => $data['transaction_status'],
                    'vnpay_pay_date'           => $data['pay_date'],
                ]),
            ]);

            if ($data['success']) {
                $user = $payment->receivedBy ?? $payment->payer;
                $this->paymentService->approvePending($payment, $user);
            } elseif (! $payment->trashed()) {
                $payment->update(['status' => 'REJECTED']);
                $payment->delete();
            }

            $payment = Payment::withTrashed()->with(['property', 'allocations.invoice'])->find($payment->id);
        }

        return response()->json([
            'payment_id'      => $payment->id,
            'status'          => $payment->status,
            'provider_status' => $payment->provider_status,
            'provider_ref'    => $payment->provider_ref,
            'amount'          => (float) $payment->amount,
            'success'         => $payment->status === 'APPROVED' && $payment->provider_status === 'SUCCESS',
            'data'            => new PaymentResource($payment),
        ]);
    }
}
