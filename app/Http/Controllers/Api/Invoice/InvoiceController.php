<?php

namespace App\Http\Controllers\Api\Invoice;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\InvoiceStoreRequest;
use App\Http\Requests\Invoice\InvoiceUpdateRequest;
use App\Http\Resources\Invoice\InvoiceResource;
use App\Models\Invoice\Invoice;
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

    /**
     * Danh sách hóa đơn
     *
     * Lấy danh sách hóa đơn. Hỗ trợ lọc theo Property, Room, Contract, Status.
     *
     * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
     * @queryParam search string Tìm kiếm theo mã phòng.
     * @queryParam filter[status] string Lọc trạng thái: DRAFT, ISSUED, PENDING, PAID, OVERDUE, CANCELLED.
     * @queryParam filter[property_id] string Lọc theo tòa nhà.
     * @queryParam filter[room_id] string Lọc theo phòng.
     * @queryParam sort string Sắp xếp: due_date, total_amount, created_at. Thêm "-" để DESC.
     */
    public function index(Request $request)
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
     * Xóa hóa đơn
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
}