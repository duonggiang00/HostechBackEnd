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
use Spatie\QueryBuilder\AllowedFilter;

/**
 * Quản lý Phòng (Rooms)
 * 
 * API quản lý các phòng trong một tầng (Floor) của tòa nhà.
 * @tags Quản lý Phòng
 */
#[Group('Quản lý Phòng')]
class RoomController extends Controller
{
    public function __construct(protected RoomService $service) {}

    /**
     * Danh sách phòng
     * 
     * Lấy danh sách phòng. Hỗ trợ lọc theo Property, Floor, Status...
     */


    /**
     * Danh sách phòng
     * 
     * Lấy danh sách phòng. Hỗ trợ lọc theo Property, Floor, Status...
     */
    public function index(RoomIndexRequest $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = [
            'code', 
            'status', 
            'type', 
            AllowedFilter::exact('property_id'),
            AllowedFilter::exact('floor_id')
        ];
        $search = $request->input('search');

        $paginator = $this->service->paginate($allowed, $perPage, $search);

        return RoomResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách phòng đã xóa (Thùng rác)
     * 
     * Lấy danh sách các phòng đã bị xóa tạm thời (Soft Delete).
     */
    public function trash(RoomIndexRequest $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = ['code', 'status', 'type', 'property_id'];
        $search = $request->input('search');

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

        return RoomResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Tạo phòng mới
     * 
     * Thêm một phòng mới vào hệ thống.
     */
    public function store(RoomStoreRequest $request)
    {
        $this->authorize('create', Room::class);

        $data = $request->validated();
        $user = $request->user();

        $property = \App\Models\Property::find($data['property_id']);
        if (! $property) {
             return response()->json(['message' => 'Property not found'], 404);
        }

        // Security: Check if Property belongs to User's Org (if not Admin)
        if (! $user->hasRole('Admin') && $user->org_id && (string)$property->org_id !== (string)$user->org_id) {
             return response()->json(['message' => 'Unauthorized: You cannot add rooms to a property in another organization.'], 403);
        }
        
        // Auto-assign org_id from Property (secure now)
        $data['org_id'] = $property->org_id;

        $room = $this->service->create($data);

        return new RoomResource($room);
    }

    /**
     * Chi tiết phòng
     * 
     * Xem thông tin chi tiết của một phòng.
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
     * 
     * Cập nhật thông tin của một phòng.
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
     * 
     * Đưa phòng vào thùng rác tạm thời.
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
     * 
     * Khôi phục phòng đã bị xóa tạm thời.
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
     * 
     * Xóa hoàn toàn phòng khỏi hệ thống. Không thể khôi phục.
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
