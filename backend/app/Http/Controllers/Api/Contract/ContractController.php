<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractIndexRequest;
use App\Http\Requests\Contract\ContractStoreRequest;
use App\Http\Requests\Contract\ContractUpdateRequest;
use App\Http\Requests\Contract\ExecuteRoomTransferRequest;
use App\Http\Requests\Contract\RoomTransferRequest;
use App\Http\Resources\Contract\ContractResource;
use App\Http\Resources\Contract\ContractStatusHistoryResource;
use App\Models\Contract\Contract;
use App\Services\Contract\ContractService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Quản lý Hợp đồng (Contracts)
 *
 * API quản lý hợp đồng thuê và cư dân.
 */
#[Group('Quản lý Hợp đồng')]
class ContractController extends Controller
{
    public function __construct(protected ContractService $service) {}

    /**
     * Lấy danh sách hợp đồng. Hỗ trợ lọc theo Property, Room, Status.
     */
    public function index(ContractIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Contract::class);

        $paginator = $this->service->paginate(
            allowedFilters: ['property_id', 'room_id', 'status'],
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
            user: $request->user()
        );

        $statusCounts = $this->service->getStatusCounts(
            user: $request->user(),
            propertyId: $request->input('filter.property_id'),
        );

        return ContractResource::collection($paginator)->additional([
            'status_counts' => $statusCounts,
        ]);
    }

    /**
     * Danh sách hợp đồng đã xóa (Thùng rác)
     */
    public function trash(ContractIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Contract::class);

        $paginator = $this->service->paginateTrash(
            allowedFilters: ['property_id', 'room_id', 'status'],
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
            user: $request->user()
        );

        return ContractResource::collection($paginator);
    }

    /**
     * Tạo hợp đồng mới
     */
    public function store(ContractStoreRequest $request): ContractResource
    {
        $this->authorize('create', Contract::class);

        $contract = $this->service->create($request->validated(), $request->user());

        return new ContractResource($contract);
    }

    /**
     * Chi tiết hợp đồng
     */
    public function show(string $id): ContractResource|JsonResponse
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $contract);

        return new ContractResource($contract);
    }

    /**
     * Cập nhật hợp đồng
     */
    public function update(ContractUpdateRequest $request, string $id): ContractResource|JsonResponse
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('update', $contract);

        $updated = $this->service->update($id, $request->validated());

        return new ContractResource($updated);
    }

    /**
     * Xóa hợp đồng (Soft Delete)
     */
    public function destroy(string $id): JsonResponse
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('delete', $contract);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục hợp đồng
     */
    public function restore(string $id): ContractResource|JsonResponse
    {
        $contract = $this->service->findTrashed($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('restore', $contract);

        $this->service->restore($id);

        return new ContractResource($contract);
    }

    /**
     * Xóa vĩnh viễn hợp đồng
     */
    public function forceDelete(string $id): JsonResponse
    {
        $contract = $this->service->findWithTrashed($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('forceDelete', $contract);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }

    /**
     * Hợp đồng chờ ký của tôi (Dành cho Tenant)
     *
     * Liệt kê các hợp đồng mà user hiện tại đang được gán nhưng chưa xác nhận.
     */
    public function myPendingContracts(Request $request): AnonymousResourceCollection
    {
        $contracts = $this->service->myPendingContracts($request->user());

        return ContractResource::collection($contracts);
    }

    /**
     * Danh sách hợp đồng của tôi (Tất cả - Dành cho Tenant)
     *
     * Liệt kê các hợp đồng mà user hiện tại đang được gán không phân biệt pending, active hay expired.
     */
    public function myContracts(Request $request): AnonymousResourceCollection
    {
        $contracts = $this->service->myContracts($request->user());

        return ContractResource::collection($contracts);
    }

    /**
     * Xác nhận ký hợp đồng
     *
     * Tenant đồng ý và tiến hành tham gia hợp đồng.
     * Chỉ hoạt động khi user hiện tại là thành viên PENDING của hợp đồng này.
     */
    public function acceptSignature(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $success = $this->service->acceptSignature($contract, $request->user());

        if (! $success) {
            abort(403, 'Bạn không có quyền hoặc hợp đồng này không ở trạng thái chờ ký.');
        }

        return response()->json(['message' => 'Đã xác nhận hợp đồng thành công.']);
    }

    /**
     * Ký hợp đồng bằng chữ ký điện tử
     */
    public function sign(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $validated = $request->validate([
            'signature_image' => 'required|string',
        ]);

        $this->service->signContract($contract, $validated['signature_image']);

        return response()->json(['message' => 'Đã ký hợp đồng thành công.']);
    }

    /**
     * Từ chối hợp đồng
     *
     * Tenant từ chối tham gia hợp đồng.
     * Chỉ hoạt động khi user hiện tại là thành viên PENDING của hợp đồng này.
     */
    public function rejectSignature(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $success = $this->service->rejectSignature($contract, $request->user());

        if (! $success) {
            abort(403, 'Bạn không có quyền thao tác trên hợp đồng này.');
        }

        return response()->json(['message' => 'Đã từ chối hợp đồng.']);
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  TENANT SELF-SERVICE
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Danh sách phòng trống cùng Tòa nhà (để xem trước khi xin đổi phòng)
     *
     * Tenant có hợp đồng ACTIVE tại Tòa nhà có thể xem danh sách phòng trống (AVAILABLE)
     * trong cùng Property, phục vụ mục đích xin đổi phòng.
     */
    public function availableRooms(Request $request, string $id): JsonResponse
    {
        $contract = Contract::with('property')->findOrFail($id);

        $this->authorize('view', $contract);

        $rooms = $this->service->getAvailableRoomsForTransfer($contract);

        return response()->json([
            'data' => $rooms,
            'current_room_id' => $contract->room_id,
            'property_name' => $contract->property->name ?? null,
        ]);
    }

    /**
     * Xin đổi phòng (Room Transfer Request)
     *
     * Tenant gửi yêu cầu đổi sang phòng khác trong cùng Tòa nhà.
     * Quản lý sẽ xem xét và phê duyệt hoặc từ chối yêu cầu.
     */
    public function roomTransferRequest(RoomTransferRequest $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('view', $contract);

        $success = $this->service->requestRoomTransfer($contract, $request->user(), $request->validated());

        if (! $success) {
            abort(422, 'Phòng đích không hợp lệ hoặc không còn trống.');
        }

        return response()->json([
            'message' => 'Đã gửi yêu cầu đổi phòng thành công. Quản lý sẽ xem xét trong thời gian sớm nhất.',
            'target_room' => [
                'id' => $request->validated()['target_room_id'],
            ],
        ]);
    }

    /**
     * Xác nhận thanh toán & Kích hoạt hợp đồng (Admin)
     *
     * Luồng: Contract (PENDING_PAYMENT) -> Confirm -> ACTIVE.
     * Đồng thời đổi trạng thái Room -> occupied.
     */
    public function confirmPayment(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('update', $contract);

        $this->service->confirmPayment($contract, $request->user());

        return response()->json(['message' => 'Đã xác nhận thanh toán và kích hoạt hợp đồng thành công.']);
    }

    /**
     * Thanh lý hợp đồng / Kết thúc sớm (Admin)
     *
     * Quy tắc xử lý tiền cọc:
     * - Tenant hủy trước hạn + waive_penalty=false → Phạt toàn bộ cọc (FORFEITED, status CANCELLED)
     * - Tenant hủy trước hạn + waive_penalty=true → Hoàn cọc (REFUND_PENDING, status TERMINATED)
     * - Chủ nhà hủy hoặc kết thúc đúng hạn → Hoàn cọc (REFUND_PENDING)
     */
    public function terminate(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('update', $contract);

        $validated = $request->validate([
            'termination_date'    => 'nullable|date',
            'cancellation_party'  => 'nullable|string|in:LANDLORD,TENANT,MUTUAL',
            'cancellation_reason' => 'nullable|string|max:1000',
            'waive_penalty'       => 'nullable|boolean',
            'refund_remaining_rent' => 'nullable|boolean',
        ]);

        $this->service->terminate($contract, $validated);

        return response()->json(['message' => 'Đã thanh lý hợp đồng thành công.']);
    }

    /**
     * Tenant gửi yêu cầu dời đi trước hạn
     *
     * Chuyển hợp đồng sang trạng thái PENDING_TERMINATION.
     * Manager sẽ nhìn thấy yêu cầu này và quyết định xử lý cọc.
     */
    public function requestTermination(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('view', $contract);

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $this->service->requestTermination($contract, $request->user(), $validated);

        return response()->json([
            'message' => 'Đã gửi yêu cầu dời đi. Quản lý sẽ xác nhận và xử lý tiền cọc sau khi kiểm tra.',
        ]);
    }

    /**
     * Lịch sử trạng thái của hợp đồng (Timeline)
     *
     * Trả về toàn bộ lịch sử chuyển trạng thái theo thời gian.
     */
    public function statusHistories(string $id): AnonymousResourceCollection
    {
        $contract = Contract::with([
            'statusHistories.changedBy:id,full_name,email',
        ])->findOrFail($id);

        $this->authorize('view', $contract);

        return ContractStatusHistoryResource::collection($contract->statusHistories);
    }

    /**
     * Thực hiện chuyển phòng cho khách hàng
     *
     * Chấm dứt hợp đồng cũ, tạo hợp đồng mới và thực hiện điều chuyển cọc, tiền nhà thừa.
     */
    public function executeTransfer(ExecuteRoomTransferRequest $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('update', $contract);

        $this->service->executeTransfer($contract, $request->validated(), $request->user());

        return response()->json([
            'message' => 'Đã thực hiện chuyển phòng thành công.',
        ]);
    }
}
