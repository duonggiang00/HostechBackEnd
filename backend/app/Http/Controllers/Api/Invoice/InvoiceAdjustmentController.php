<?php

namespace App\Http\Controllers\Api\Invoice;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\InvoiceAdjustmentStoreRequest;
use App\Http\Resources\Invoice\InvoiceAdjustmentResource;
use App\Http\Resources\Invoice\InvoiceStatusHistoryResource;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceAdjustment;
use App\Services\Invoice\InvoiceAdjustmentService;
use App\Services\Invoice\InvoiceService;
use Dedoc\Scramble\Attributes\Group;

/**
 * Quản lý Điều chỉnh & Lịch sử Hóa đơn (Invoice Adjustments & Histories)
 *
 * API quản lý các khoản điều chỉnh (CREDIT/DEBIT) và lịch sử thay đổi trạng thái của hóa đơn.
 */
#[Group('Điều chỉnh & Lịch sử Hóa đơn')]
class InvoiceAdjustmentController extends Controller
{
    public function __construct(
        protected InvoiceAdjustmentService $adjustmentService,
        protected InvoiceService $invoiceService
    ) {
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  STATUS HISTORY ENDPOINTS                             ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Lịch sử thay đổi trạng thái hóa đơn
     *
     * Lấy danh sách lịch sử thay đổi trạng thái của 1 hóa đơn theo thời gian.
     */
    public function histories(string $invoice)
    {
        $invoiceModel = $this->invoiceService->find($invoice);
        if (!$invoiceModel) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('view', $invoiceModel);

        $histories = $invoiceModel->statusHistories()
            ->with('changedBy')
            ->orderBy('created_at', 'desc')
            ->get();

        return InvoiceStatusHistoryResource::collection($histories);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  ADJUSTMENT ENDPOINTS                                 ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách khoản điều chỉnh của hóa đơn
     *
     * Lấy danh sách các khoản điều chỉnh (CREDIT/DEBIT) của 1 hóa đơn.
     */
    public function index(string $invoice)
    {
        $invoiceModel = $this->invoiceService->find($invoice);
        if (!$invoiceModel) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('view', $invoiceModel);

        $perPage = (int) request()->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100)
            $perPage = 15;

        $paginator = $this->adjustmentService->paginateByInvoice($invoiceModel, $perPage);

        return InvoiceAdjustmentResource::collection($paginator);
    }

    /**
     * Tạo khoản điều chỉnh cho hóa đơn
     *
     * Tạo 1 khoản điều chỉnh (CREDIT giảm trừ / DEBIT thu thêm) cho hóa đơn.
     * Chỉ áp dụng cho hóa đơn có trạng thái ISSUED hoặc PENDING.
     */
    public function store(InvoiceAdjustmentStoreRequest $request, string $invoice)
    {
        $invoiceModel = $this->invoiceService->find($invoice);
        if (!$invoiceModel) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoiceModel);

        $adjustment = $this->adjustmentService->createAdjustment(
            $invoiceModel,
            $request->validated(),
            $request->user()
        );

        return (new InvoiceAdjustmentResource($adjustment->load(['createdBy'])))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Duyệt khoản điều chỉnh
     *
     * Duyệt/Phê duyệt khoản điều chỉnh. Sau khi duyệt, total_amount hóa đơn sẽ được tính lại tự động.
     */
    public function approve(string $invoice, string $adjustment)
    {
        $invoiceModel = $this->invoiceService->find($invoice);
        if (!$invoiceModel) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoiceModel);

        $adjustmentModel = $this->adjustmentService->find($adjustment);
        if (!$adjustmentModel || $adjustmentModel->invoice_id !== $invoiceModel->id) {
            abort(404, 'Adjustment Not Found');
        }

        $approved = $this->adjustmentService->approveAdjustment(
            $adjustmentModel,
            request()->user()
        );

        return new InvoiceAdjustmentResource($approved);
    }

    /**
     * Xóa khoản điều chỉnh
     *
     * Chỉ xóa được khoản điều chỉnh chưa được duyệt.
     */
    public function destroy(string $invoice, string $adjustment)
    {
        $invoiceModel = $this->invoiceService->find($invoice);
        if (!$invoiceModel) {
            abort(404, 'Invoice Not Found');
        }

        $this->authorize('update', $invoiceModel);

        $adjustmentModel = $this->adjustmentService->find($adjustment);
        if (!$adjustmentModel || $adjustmentModel->invoice_id !== $invoiceModel->id) {
            abort(404, 'Adjustment Not Found');
        }

        $this->adjustmentService->deleteAdjustment($adjustmentModel);

        return response()->json(['message' => 'Adjustment deleted successfully']);
    }
}
