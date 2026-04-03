<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\IndexPaymentRequest;
use App\Http\Requests\Finance\StorePaymentRequest;
use App\Http\Resources\Finance\PaymentResource;
use App\Models\Finance\Payment;
use App\Services\Finance\PaymentService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Phân hệ Thanh toán (Payments)
 *
 * API thu tiền và gạch nợ hóa đơn.
 */
#[Group('Tài chính – Thanh toán')]
class PaymentController extends Controller
{
    public function __construct(protected PaymentService $service) {}

    // ╔═══════════════════════════════════════════════════════╗
    // ║  READ ENDPOINTS                                       ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách giao dịch thanh toán
     *
     * Lấy danh sách các giao dịch thu tiền. Hỗ trợ lọc theo Property, Status, Phương thức.
     */
    public function index(IndexPaymentRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Payment::class);

        $paginator = $this->service->paginate(
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
        );

        return PaymentResource::collection($paginator);
    }

    /**
     * Chi tiết giao dịch thanh toán
     *
     * Xem thông tin chi tiết 1 giao dịch và danh sách hóa đơn đã gạch nợ.
     */
    public function show(string $id): PaymentResource
    {
        $payment = $this->service->find($id);
        if (! $payment) {
            abort(404, 'Payment Not Found');
        }

        $this->authorize('view', $payment);

        return new PaymentResource($payment);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  WRITE ENDPOINTS                                      ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Ghi nhận thu tiền & gạch nợ hóa đơn
     *
     * Tạo giao dịch thu tiền và tự động gạch nợ các hóa đơn được chỉ định.
     * SUM(allocations.amount) phải bằng payment.amount.
     * Tự động cập nhật trạng thái hóa đơn sang PAID nếu đủ tiền.
     */
    public function store(StorePaymentRequest $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $data = $request->validated();
        $user = $request->user();

        // Tự động gán org_id từ user nếu không phải Admin
        if (! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        }

        if (empty($data['org_id'])) {
            abort(422, 'Không thể xác định org_id cho giao dịch này.');
        }

        $payment = $this->service->create($data, $user);

        return (new PaymentResource($payment))->response()->setStatusCode(201);
    }

    /**
     * Hủy giao dịch thanh toán
     *
     * Soft delete giao dịch và hoàn tác trạng thái gạch nợ trên các hóa đơn liên quan.
     * Ghi bút toán đảo ngược vào sổ cái.
     */
    public function destroy(string $id): JsonResponse
    {
        $payment = $this->service->find($id);
        if (! $payment) {
            abort(404, 'Payment Not Found');
        }

        $this->authorize('delete', $payment);

        $this->service->void($payment);

        return response()->json(['message' => 'Payment voided successfully'], 200);
    }
}
