<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractIndexRequest;
use App\Http\Requests\Contract\ContractStoreRequest;
use App\Http\Requests\Contract\ContractUpdateRequest;
use App\Http\Resources\Contract\ContractResource;
use App\Models\Contract\Contract;
use App\Services\Contract\ContractService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

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
     * Danh sách hợp đồng
     * 
     * Lấy danh sách hợp đồng. Hỗ trợ lọc theo Property, Room, Status.
     */
    public function index(ContractIndexRequest $request)
    {
        $this->authorize('viewAny', Contract::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['property_id', 'room_id', 'status', 'start_date_after'];
        $search = $request->input('search');

        // Security: Filter by Org for non-Admin
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginate($allowed, $perPage, $search, $orgId);

        return ContractResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách hợp đồng đã xóa (Thùng rác)
     * 
     * @queryParam per_page int Số lượng bản ghi mỗi trang. Example: 10
     * @queryParam page int Trang hiện tại. Example: 1
     * @queryParam search string Từ khóa tìm kiếm.
     * @queryParam filter[property_id] string ID Bất động sản.
     * @queryParam filter[room_id] string ID Phòng.
     * @queryParam filter[status] string Trạng thái.
     * @queryParam sort string Sắp xếp.
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', Contract::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['property_id', 'room_id', 'status'];
        $search = $request->input('search');
        
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search, $orgId);

        return ContractResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Tạo hợp đồng mới
     */
    public function store(ContractStoreRequest $request)
    {
        $this->authorize('create', Contract::class);

        $data = $request->validated();
        
        // Auto-assign org_id from user
        $user = $request->user();
        if (! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } else {
             // Admin might provide org_id? For now assume admin acts in context of their org or passed org_id?
             // Simplification: Contract must belong to same org as property/room.
             // We can fetch org_id from room_id if not present.
             // But let's trust validations or service helper.
             // Service handles creation.
             if (!isset($data['org_id'])) {
                  $room = \App\Models\Property\Room::find($data['room_id']);
                  $data['org_id'] = $room->org_id;
             }
        }
        $data['created_by_user_id'] = $user->id;

        $contract = $this->service->create($data);

        return new ContractResource($contract);
    }

    /**
     * Chi tiết hợp đồng
     */
    public function show(string $id)
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $contract);

        return new ContractResource($contract);
    }

    /**
     * Cập nhật hợp đồng
     */
    public function update(ContractUpdateRequest $request, string $id)
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $contract);

        $updated = $this->service->update($id, $request->validated());

        return new ContractResource($updated);
    }

    /**
     * Xóa hợp đồng (Soft Delete)
     */
    public function destroy(string $id)
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $contract);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục hợp đồng
     */
    public function restore(string $id)
    {
        $contract = $this->service->findTrashed($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('restore', $contract);

        $this->service->restore($id);

        return new ContractResource($contract);
    }

    /**
     * Xóa vĩnh viễn hợp đồng
     */
    public function forceDelete(string $id)
    {
        $contract = $this->service->findWithTrashed($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('forceDelete', $contract);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
