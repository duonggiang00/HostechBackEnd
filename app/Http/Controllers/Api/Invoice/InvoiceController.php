<?php

namespace App\Http\Controllers\Api\Invoice;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\InvoiceIndexRequest;
use App\Http\Requests\Invoice\InvoiceStoreRequest;
use App\Http\Requests\Invoice\InvoiceUpdateRequest;
use App\Http\Resources\Invoice\InvoiceResource;
use App\Http\Resources\Invoice\InvoiceItemResource;
use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceItem;
use App\Services\Invoice\InvoiceService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Quản lý Hóa đơn (Invoices)
 *
 * API quản lý hóa đơn thanh toán hàng tháng.
 */
#[Group('Quản lý Hóa đơn')]
class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $service)
    {
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  LIST / READ ENDPOINTS                                ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách hóa đơn
     *
     * Lấy danh sách hóa đơn. Hỗ trợ lọc theo Property, Room, Contract, Status.
     */
    public function index(InvoiceIndexRequest $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100)
            $perPage = 15;

        $allowed = ['status', 'property_id', 'room_id', 'contract_id'];
        $search = $request->input('search');

        // Security: non-Admin chỉ thấy data trong org của mình
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginate($allowed, $perPage, $search, $orgId);

        return InvoiceResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách hóa đơn theo Tòa nhà (Property)
     *
     * Lấy danh sách hóa đơn thuộc 1 Tòa nhà cụ thể. Hỗ trợ lọc, sắp xếp, phân trang.
     */
    public function indexByProperty(InvoiceIndexRequest $request, string $property_id)
    {
        $this->authorize('viewAny', Invoice::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100)
            $perPage = 15;

        $search = $request->input('search');
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginateByProperty($property_id, $perPage, $search, $orgId);

        return InvoiceResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách hóa đơn theo Tầng (Floor) trong Tòa nhà
     *
     * Lấy danh sách hóa đơn thuộc 1 Tầng cụ thể trong Tòa nhà. Hỗ trợ lọc, sắp xếp, phân trang.
     */
    public function indexByFloor(InvoiceIndexRequest $request, string $property_id, string $floor_id)
    {
        $this->authorize('viewAny', Invoice::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100)
            $perPage = 15;

        $search = $request->input('search');
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginateByFloor($property_id, $floor_id, $perPage, $search, $orgId);

        return InvoiceResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách hóa đơn đã xóa (Thùng rác)
     *
     * Lấy danh sách hóa đơn đã xóa mềm. Hỗ trợ lọc, sắp xếp, phân trang.
     */
    public function trash(InvoiceIndexRequest $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100)
            $perPage = 15;

        $allowed = ['status', 'property_id', 'room_id'];
        $search = $request->input('search');

        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search, $orgId);

        return InvoiceResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Chi tiết hóa đơn
     *
     * Xem thông tin chi tiết 1 hóa đơn, bao gồm danh sách items.
     */
    public function show(string $id)
    {
        $invoice = $this->service->find($id);
        if (!$invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $invoice);

        return new InvoiceResource($invoice);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  CREATE / UPDATE / DELETE ENDPOINTS                    ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo hóa đơn mới
     *
     * Tạo hóa đơn kèm danh sách items chi tiết (tiền phòng, điện, nước, dịch vụ...).
     */
    public function store(InvoiceStoreRequest $request)
    {
        $this->authorize('create', Invoice::class);

        $data = $request->except('items');
        $itemsData = $request->input('items', []);

        // Auto-assign org_id
        $user = $request->user();
        if (!$user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } else {
            // Admin: lấy org_id từ room nếu không truyền
            if (!isset($data['org_id'])) {
                $room = \App\Models\Property\Room::find($data['room_id']);
                $data['org_id'] = $room?->org_id;
            }
        }

        $data['created_by_user_id'] = $user->id;
        $data['status'] = $data['status'] ?? 'DRAFT';

        $invoice = $this->service->create($data, $itemsData);

        return (new InvoiceResource($invoice))->response()->setStatusCode(201);
    }

    /**
     * Cập nhật hóa đơn
     *
     * Cập nhật trạng thái, hạn thanh toán, số tiền đã trả...
     */
    public function update(InvoiceUpdateRequest $request, string $id)
    {
        $invoice = $this->service->find($id);
        if (!$invoice) {
            return response()->json(['message' => 'Not Found'], 404);
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
    public function destroy(string $id)
    {
        $invoice = $this->service->find($id);
        if (!$invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $invoice);

        // Business rule: chỉ xóa được DRAFT
        if ($invoice->status !== 'DRAFT') {
            return response()->json([
                'message' => 'Chỉ có thể xóa hóa đơn ở trạng thái Nháp (DRAFT).'
            ], 422);
        }

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  SOFT-DELETES: TRASH / RESTORE / FORCE-DELETE         ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Khôi phục hóa đơn đã xóa
     */
    public function restore(string $id)
    {
        $invoice = $this->service->findTrashed($id);
        if (!$invoice) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('restore', $invoice);

        $this->service->restore($id);

        return new InvoiceResource($invoice->fresh());
    }

    /**
     * Xóa vĩnh viễn hóa đơn
     */
    public function forceDelete(string $id)
    {
        $invoice = $this->service->findWithTrashed($id);
        if (!$invoice) {
            return response()->json(['message' => 'Not Found'], 404);
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
    public function storeItem(Request $request, string $invoice)
    {
        $invoiceModel = $this->service->find($invoice);
        if (!$invoiceModel) {
            return response()->json(['message' => 'Invoice Not Found'], 404);
        }

        $this->authorize('update', $invoiceModel);

        $validated = $request->validate([
            'type' => ['required', 'string', 'in:RENT,SERVICE,PENALTY,DISCOUNT,ADJUSTMENT'],
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
    public function destroyItem(string $item)
    {
        $invoiceItem = InvoiceItem::with('invoice')->find($item);
        if (!$invoiceItem) {
            return response()->json(['message' => 'Invoice Item Not Found'], 404);
        }

        $this->authorize('update', $invoiceItem->invoice);

        $this->service->destroyItem($invoiceItem);

        return response()->json(['message' => 'Item deleted successfully'], 200);
    }
}