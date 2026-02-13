<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoomIndexRequest;
use App\Http\Requests\RoomStoreRequest;
use App\Http\Requests\RoomUpdateRequest;
use App\Http\Resources\RoomResource;
use App\Models\Room;
use App\Services\RoomService;

use Dedoc\Scramble\Attributes\Group; // Added

/**
 * Quản lý Phòng (Rooms)
 * 
 * API quản lý các phòng trong một tầng (Floor) của tòa nhà.
 */
#[Group('Quản lý Bất động sản')]
class RoomController extends Controller
{
    public function __construct(protected RoomService $service) {}

    /**
     * Danh sách phòng
     * 
     * Lấy danh sách phòng. Hỗ trợ lọc theo Property, Floor, Status...
     */
    public function index(RoomIndexRequest $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);
        $allowed = ['code', 'status', 'type', 'property_id'];

        $paginator = $this->service->paginate($allowed, $perPage);

        return RoomResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Tạo phòng mới
     */
    public function store(RoomStoreRequest $request)
    {
        $this->authorize('create', Room::class);

        $data = $request->validated();
        $data['org_id'] = request()->header('X-Org-Id');

        $room = $this->service->create($data);

        return new RoomResource($room);
    }

    /**
     * Chi tiết phòng
     */
    public function show(string $id)
    {
        $room = $this->service->find($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $room);

        return new RoomResource($room);
    }

    /**
     * Cập nhật phòng
     */
    public function update(RoomUpdateRequest $request, string $id)
    {
        $room = $this->service->find($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $room);

        $updated = $this->service->update($id, $request->validated());

        return new RoomResource($updated);
    }

    /**
     * Xóa phòng (Soft Delete)
     */
    public function destroy(string $id)
    {
        $room = $this->service->find($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $room);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục phòng
     */
    public function restore(string $id)
    {
        $room = $this->service->findTrashed($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $room);

        $this->service->restore($id);

        return new RoomResource($room);
    }

    /**
     * Xóa vĩnh viễn phòng
     */
    public function forceDelete(string $id)
    {
        $room = $this->service->findWithTrashed($id);
        if (! $room) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $room);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
