<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractIndexRequest;
use App\Http\Requests\Contract\ContractStoreRequest;
use App\Http\Requests\Contract\ContractUpdateRequest;
use App\Http\Requests\Contract\RoomTransferRequest;
use App\Http\Resources\Contract\ContractResource;
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

        return ContractResource::collection($paginator);
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
}
