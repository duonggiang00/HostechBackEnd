<?php

namespace App\Http\Controllers\Api\Invoice;

use App\Enums\InvoiceItemType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\InvoiceIndexRequest;
use App\Http\Requests\Invoice\InvoiceStoreRequest;
use App\Http\Requests\Invoice\InvoiceUpdateRequest;
use App\Http\Resources\Invoice\InvoiceItemResource;
use App\Http\Resources\Invoice\InvoiceResource;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Services\Invoice\InvoiceService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\Rule;

/**
 * Quản lý Hóa đơn (Invoices)
 *
 * API quản lý hóa đơn thanh toán hàng tháng.
 */
#[Group('Quản lý Hóa đơn')]
class InvoiceController extends Controller
{
    public function __construct(
        protected InvoiceService $service,
        protected \App\Services\Finance\PaymentService $paymentService
    ) {}


    // ╔═══════════════════════════════════════════════════════╗
    // ║  LIST / READ ENDPOINTS                                ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách hóa đơn
     *
     * Lấy danh sách hóa đơn. Hỗ trợ lọc theo Property, Room, Contract, Status.
     */
    public function index(InvoiceIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Invoice::class);

        $paginator = $this->service->paginate(
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
        );

        return InvoiceResource::collection($paginator);
    }

    /**
     * Danh sách hóa đơn theo Tòa nhà (Property)
     *
     * Lấy danh sách hóa đơn thuộc 1 Tòa nhà cụ thể. Hỗ trợ lọc, sắp xếp, phân trang.
     */
    public function indexByProperty(InvoiceIndexRequest $request, string $property_id): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Invoice::class);

        $paginator = $this->service->paginateByProperty(
            propertyId: $property_id,
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
        );

        return InvoiceResource::collection($paginator);
    }

    /**
     * Danh sách hóa đơn theo Tầng (Floor) trong Tòa nhà
     *
     * Lấy danh sách hóa đơn thuộc 1 Tầng cụ thể trong Tòa nhà. Hỗ trợ lọc, sắp xếp, phân trang.
     */
    public function indexByFloor(InvoiceIndexRequest $request, string $property_id, string $floor_id): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Invoice::class);

        $paginator = $this->service->paginateByFloor(
            propertyId: $property_id,
            floorId: $floor_id,
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
        );

        return InvoiceResource::collection($paginator);
    }

    /**
     * Danh sách hóa đơn đã xóa (Thùng rác)
     *
     * Lấy danh sách hóa đơn đã xóa mềm. Hỗ trợ lọc, sắp xếp, phân trang.
     */
    public function trash(InvoiceIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Invoice::class);

        $paginator = $this->service->paginateTrash(
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
        );

        return InvoiceResource::collection($paginator);
    }

    /**
     * Chi tiết hóa đơn
     *
     * Xem thông tin chi tiết 1 hóa đơn, bao gồm danh sách items.
     */
    public function show(string $id): InvoiceResource
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $invoice);

        return new InvoiceResource($invoice);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  CREATE / UPDATE / DELETE ENDPOINTS                    ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Kích hoạt tạo hóa đơn định kỳ
     *
     * Tạo hóa đơn tự động cho các hợp đồng đang hoạt động trong tháng chỉ định.
     */
    public function generateMonthly(Request $request, \App\Services\Invoice\RecurringBillingService $recurringBillingService): JsonResponse
    {
        $this->authorize('create', Invoice::class);

        $validated = $request->validate([
            'org_id' => ['required', 'uuid'],
            'month'  => ['required', 'date_format:Y-m'], // e.g. "2024-10"
        ]);

        $user = $request->user();
        if (! $user->hasRole('Admin') && $user->org_id !== $validated['org_id']) {
            abort(403, 'Unauthorized to run billing for this organization.');
        }

        $periodMonth = \Carbon\Carbon::createFromFormat('Y-m', $validated['month'])->startOfMonth();

        $results = $recurringBillingService->generateMonthlyInvoices($validated['org_id'], $periodMonth);

        return response()->json([
            'message' => 'Invoice generation completed',
            'data'    => $results,
        ], 200);
    }

    /**
     * Kích hoạt tạo hóa đơn định kỳ cho cụ thể 1 tòa nhà
     */
    public function generateMonthlyForProperty(Request $request, string $property_id, \App\Services\Invoice\InvoiceService $invoiceService): JsonResponse
    {
        $this->authorize('create', Invoice::class);

        $property = \App\Models\Property\Property::findOrFail($property_id);
        
        $user = $request->user();
        if (! $user->hasRole('Admin') && $user->org_id !== $property->org_id) {
            abort(403, 'Unauthorized to run billing for this organization.');
        }

        $validated = $request->validate([
            'billing_date' => ['nullable', 'date'],
        ]);

        $count = $invoiceService->createMonthlyInvoicesForProperty($property, [
            'billing_date' => $validated['billing_date'] ?? now()->toDateString(),
        ]);

        return response()->json([
            'message' => 'Đã chốt tiền tháng cho tòa nhà.',
            'count'   => $count,
        ], 200);
    }

    /**
     * Tạo hóa đơn mới
     *
     * Tạo hóa đơn kèm danh sách items chi tiết (tiền phòng, điện, nước, dịch vụ...).
     */
    public function store(InvoiceStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Invoice::class);

        $data = $request->except('items');
        $itemsData = $request->input('items', []);

        $data['status'] = $data['status'] ?? 'DRAFT';

        $invoice = $this->service->create($data, $itemsData);

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    /**
     * Cập nhật hóa đơn
     *
     * Cập nhật trạng thái, hạn thanh toán, số tiền đã trả...
     */
    public function update(InvoiceUpdateRequest $request, string $id): InvoiceResource
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            abort(404, 'Not Found');
        }

        $this->authorize('update', $invoice);

        $updated = $this->service->update($id, $request->validated());

        return new InvoiceResource($updated);
    }

    /**
     * Xóa hóa đơn (Soft Delete)
     *
     * Chỉ xóa được khi hóa đơn ở trạng thái DRAFT.
     */
    public function destroy(string $id): JsonResponse
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            abort(404, 'Not Found');
        }

        $this->authorize('delete', $invoice);

        // Business rule: chỉ xóa được DRAFT
        if ($invoice->status !== 'DRAFT') {
            return response()->json([
                'message' => 'Chỉ có thể xóa hóa đơn ở trạng thái Nháp (DRAFT).',
            ], 422);
        }

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  STATUS TRANSITION ENDPOINTS                          ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Phát hành hóa đơn
     *
     * Chuyển trạng thái hóa đơn từ DRAFT sang ISSUED.
     * Tự động ghi lịch sử thay đổi trạng thái.
     */
    public function issue(Request $request, string $id): InvoiceResource
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoice);

        if ($invoice->status !== 'DRAFT') {
            abort(422, 'Chỉ có thể phát hành hóa đơn ở trạng thái Nháp (DRAFT).');
        }

        $updated = $this->service->issueInvoice(
            $invoice,
            $request->user()->id,
            $request->input('note')
        );

        return new InvoiceResource($updated);
    }

    /**
     * Thanh toán hóa đơn
     *
     * Chuyển trạng thái hóa đơn sang PAID.
     * Chỉ áp dụng cho hóa đơn ISSUED hoặc PENDING.
     */
    public function pay(Request $request, string $id): JsonResponse
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoice);

        // Lấy dữ liệu thanh toán từ request hoặc mặc định thanh toán hết bằng tiền mặt
        $amount = $request->input('amount') ?? ($invoice->total_amount - ($invoice->paid_amount ?? 0));
        $method = $request->input('payment_method') ?? ($request->input('method') ?? 'CASH');
        
        // Chuẩn hóa phương thức (frontend có thể gửi 'transfer', 'cash')
        $method = strtoupper($method);
        if ($method === 'TRANSFER') $method = 'BANK_TRANSFER';

        $paymentData = [
            'org_id' => $invoice->org_id,
            'property_id' => $invoice->property_id,
            'payer_user_id' => $invoice->payer_user_id,
            'method' => $method,
            'amount' => $amount,
            'note' => $request->input('note'),
            'received_at' => now(),
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => $amount]
            ]
        ];

        $payment = $this->paymentService->create($paymentData, $request->user());

        return response()->json([
            'message' => 'Thanh toán đã được ghi nhận thành công.',
            'data' => $payment,
            'invoice' => new InvoiceResource($invoice->fresh())
        ], 200);
    }


    /**
     * Ghi nhận thanh toán (Partial or Full)
     *
     * Ghi nhận một giao dịch thanh toán cho hóa đơn.
     * Tự động chuyển trạng thái sang PAID hoặc PARTIALLY_PAID.
     */
    public function recordPayment(Request $request, string $id): JsonResponse
    {
        $invoice = $this->service->find($id);
        if (!$invoice) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'method' => ['required', 'string'],
            'reference' => ['nullable', 'string', 'max:255'],
            'received_at' => ['nullable', 'date'],
            'note' => ['nullable', 'string', 'max:1000'],
            'payer_user_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        $paymentData = array_merge($validated, [
            'org_id' => $invoice->org_id,
            'property_id' => $invoice->property_id,
            'allocations' => [
                ['invoice_id' => $invoice->id, 'amount' => $validated['amount']]
            ]
        ]);

        $payment = $this->paymentService->create($paymentData, $request->user());

        return response()->json([
            'message' => 'Thanh toán đã được ghi nhận thành công.',
            'data' => $payment,
            'invoice' => new InvoiceResource($invoice->fresh())
        ], 201);

    }

    /**
     * Hủy hóa đơn
     *
     * Chuyển trạng thái hóa đơn sang CANCELLED.
     * Không áp dụng cho hóa đơn đã thanh toán (PAID).
     */
    public function cancel(Request $request, string $id): InvoiceResource
    {
        $invoice = $this->service->find($id);
        if (! $invoice) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoice);

        if ($invoice->status === 'PAID') {
            abort(422, 'Không thể hủy hóa đơn đã thanh toán.');
        }

        if ($invoice->status === 'CANCELLED') {
            abort(422, 'Hóa đơn đã ở trạng thái Đã hủy.');
        }

        $updated = $this->service->cancelInvoice($invoice, $request->input('note'));

        return new InvoiceResource($updated);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  SOFT-DELETES: TRASH / RESTORE / FORCE-DELETE         ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Khôi phục hóa đơn đã xóa
     */
    public function restore(string $id): InvoiceResource
    {
        $invoice = $this->service->findTrashed($id);
        if (! $invoice) {
            abort(404, 'Not Found');
        }

        $this->authorize('restore', $invoice);

        $this->service->restore($id);

        return new InvoiceResource($invoice->fresh());
    }

    /**
     * Xóa vĩnh viễn hóa đơn
     */
    public function forceDelete(string $id): JsonResponse
    {
        $invoice = $this->service->findWithTrashed($id);
        if (! $invoice) {
            abort(404, 'Not Found');
        }

        $this->authorize('forceDelete', $invoice);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  INVOICE ITEMS ENDPOINTS                              ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Thêm chi tiết phí vào hóa đơn
     *
     * Thêm 1 dòng chi phí (tiền phòng, tiền điện, dịch vụ...) vào hóa đơn.
     * Tự động cập nhật lại total_amount.
     */
    public function storeItem(Request $request, string $invoice): JsonResponse
    {
        $invoiceModel = $this->service->find($invoice);
        if (! $invoiceModel) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoiceModel);

        $validated = $request->validate([
            'type' => ['required', 'string', Rule::in(InvoiceItemType::values())],
            'service_id' => ['nullable', 'uuid', 'exists:services,id'],
            'description' => ['required', 'string', 'max:255'],
            'quantity' => ['required', 'numeric', 'min:0'],
            'unit_price' => ['required', 'numeric'],
            'amount' => ['required', 'numeric'],
            'meta' => ['nullable', 'array'],
        ]);

        $item = $this->service->storeItem($invoiceModel, $validated);

        return (new InvoiceItemResource($item))->response()->setStatusCode(201);
    }

    /**
     * Xóa 1 dòng chi phí khỏi hóa đơn
     *
     * Tự động cập nhật lại total_amount sau khi xóa.
     */
    public function destroyItem(string $item): JsonResponse
    {
        $invoiceItem = InvoiceItem::with('invoice')->find($item);
        if (! $invoiceItem) {
            abort(404, 'Invoice Item Not Found');
        }

        $this->authorize('update', $invoiceItem->invoice);

        $this->service->destroyItem($invoiceItem);

        return response()->json(['message' => 'Item deleted successfully'], 200);
    }
}
