<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RoomFloorPlanRequest;
use App\Http\Requests\Property\RoomIndexRequest;
use App\Http\Requests\Property\RoomPublishRequest;
use App\Http\Requests\Property\RoomQuickCreateRequest;
use App\Http\Requests\Property\RoomStoreRequest;
use App\Http\Requests\Property\RoomUpdateRequest;
use App\Http\Resources\Property\RoomResource;
use App\Models\Property\Room;
use App\Services\Property\RoomService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;

/**
 * Quản lý Phòng (Rooms)
 *
 * API quản lý các phòng trong một tầng (Floor) của tòa nhà.
 *
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
    public function index(RoomIndexRequest $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);
        $search = $request->input('search');
        $allowed = ['code', 'status', 'type', AllowedFilter::exact('property_id'), AllowedFilter::exact('floor_id')];

        $paginator = $this->service->paginate($allowed, $perPage, $search, $request->user());

        return RoomResource::collection($paginator);
    }

    /**
     * Danh sách phòng đã xóa (Thùng rác)
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);
        $search = $request->input('search');
        $allowed = ['code', 'status', 'type', 'property_id'];

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search, $request->user());

        return RoomResource::collection($paginator);
    }

    /**
     * Tạo phòng mới
     */
    public function store(RoomStoreRequest $request)
    {
        $this->authorize('create', Room::class);

        $room = $this->service->create($request->validated(), $request->user());

        return new RoomResource($room);
    }

    /**
     * Chi tiết phòng
     */
    public function show(string $id)
    {
        $room = $this->service->find($id) ?? abort(404, 'Room not found');

        $this->authorize('view', $room);

        $room->loadMissing(['assets', 'prices', 'statusHistories', 'media']);

        return new RoomResource($room);
    }

    /**
     * Cập nhật phòng
     */
    public function update(RoomUpdateRequest $request, string $id)
    {
        $room = $this->service->find($id) ?? abort(404, 'Room not found');

        $this->authorize('update', $room);

        $updated = $this->service->update($id, $request->validated(), $request->user());

        return new RoomResource($updated);
    }

    /**
     * Xóa phòng (Soft Delete)
     */
    public function destroy(string $id)
    {
        $room = $this->service->find($id) ?? abort(404, 'Room not found');

        $this->authorize('delete', $room);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Khôi phục phòng
     */
    public function restore(string $id)
    {
        $room = $this->service->findTrashed($id) ?? abort(404, 'Room not found in trash');

        $this->authorize('delete', $room);

        $this->service->restore($id);

        return new RoomResource($room);
    }

    /**
     * Xóa vĩnh viễn phòng
     */
    public function forceDelete(string $id)
    {
        $room = $this->service->findWithTrashed($id) ?? abort(404, 'Room not found');

        $this->authorize('delete', $room);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully']);
    }

    // ─── Quick Create (Draft) ────────────────────────────────────────────────

    /**
     * Tạo phòng nhanh (Draft)
     *
     * Tạo phòng với thông tin tối thiểu. Phòng sẽ ở trạng thái `draft`
     * và không xuất hiện trong danh sách chính thức cho đến khi được publish.
     */
    public function quickCreate(RoomQuickCreateRequest $request)
    {
        $this->authorize('create', Room::class);

        $room = $this->service->quickCreate($request->validated(), $request->user());

        return (new RoomResource($room))->response()->setStatusCode(201);
    }

    /**
     * Danh sách phòng Draft
     *
     * Lấy danh sách các phòng đang ở trạng thái `draft`.
     */
    public function drafts(Request $request)
    {
        $this->authorize('viewAny', Room::class);

        $perPage = (int) $request->query('per_page', 15);

        $rooms = Room::draft()
            ->with(['property', 'floor'])
            ->paginate($perPage)
            ->withQueryString();

        return RoomResource::collection($rooms);
    }

    // ─── Publish ──────────────────────────────────────────────────────────────

    /**
     * Publish phòng
     *
     * Kích hoạt phòng từ trạng thái `draft` sang `available`.
     * Có thể truyền `code` và `base_price` để override trước khi publish.
     */
    public function publish(RoomPublishRequest $request, string $id)
    {
        $room = $this->service->find($id) ?? abort(404, 'Room not found');

        $this->authorize('publish', $room);

        $published = $this->service->publish($room, $request->validated(), $request->user());

        return new RoomResource($published);
    }

    // ─── Floor Plan Node ─────────────────────────────────────────────────────

    /**
     * Gán vị trí phòng trên sơ đồ tầng
     *
     * Tạo hoặc cập nhật vị trí (x, y, width, height) của phòng trên floor plan.
     */
    public function setFloorPlan(RoomFloorPlanRequest $request, string $id)
    {
        $room = $this->service->find($id) ?? abort(404, 'Room not found');

        $this->authorize('update', $room);

        $node = $this->service->setFloorPlanNode($room, $request->validated(), $request->user());

        return response()->json([
            'message' => 'Floor plan node updated successfully.',
            'data'    => $node,
        ]);
    }

    /**
     * Xóa vị trí phòng trên sơ đồ tầng
     */
    public function removeFloorPlan(string $id)
    {
        $room = $this->service->find($id) ?? abort(404, 'Room not found');

        $this->authorize('update', $room);

        $this->service->removeFloorPlanNode($room);

        return response()->json(['message' => 'Floor plan node removed successfully.']);
    }
}
