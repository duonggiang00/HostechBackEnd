<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\RoomIndexRequest;
use App\Http\Requests\Property\RoomStoreRequest;
use App\Http\Requests\Property\RoomUpdateRequest;
use App\Http\Resources\Property\RoomResource;
use App\Models\Property\Room;
use App\Services\Property\RoomService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request; // Added
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

    /**
     * Danh sách phòng
     *
     * Lấy danh sách phòng. Hỗ trợ lọc theo Property, Floor, Status...
     *
     * @queryParam per_page int Số lượng bản ghi mỗi trang. Example: 15
     * @queryParam page int Trang hiện tại. Example: 1
     * @queryParam search string Từ khóa tìm kiếm. Example: P.101
     * @queryParam filter[code] string Mã phòng. Example: R101
     * @queryParam filter[status] string Trạng thái. Example: AVAILABLE
     * @queryParam filter[type] string Loại phòng. Example: STANDARD
     * @queryParam filter[property_id] string ID Bất động sản. Example: uuid
     * @queryParam filter[floor_id] string ID Tầng. Example: uuid
     * @queryParam sort string Sắp xếp. Example: -code
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

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

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
}
