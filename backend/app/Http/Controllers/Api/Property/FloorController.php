<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\FloorIndexRequest;
use App\Http\Requests\Property\FloorPlanImageUploadRequest;
use App\Http\Requests\Property\FloorPlanSyncRequest;
use App\Http\Requests\Property\FloorStoreRequest;
use App\Http\Requests\Property\FloorUpdateRequest;
use App\Http\Resources\Property\FloorResource;
use App\Models\Property\Floor;
use App\Services\Property\FloorService;
use Illuminate\Http\Request;

/**
 * Quản lý Tầng (Floors)
 *
 * API quản lý các tầng trong một tòa nhà (Property).
 *
 * @tags Quản lý Tầng
 */
#[Group('Quản lý Tầng')]
class FloorController extends Controller
{
    public function __construct(protected FloorService $service) {}

    /**
     * Danh sách tầng
     *
     * Lấy danh sách các tầng. Hỗ trợ lọc theo Property.
     */
    public function index(FloorIndexRequest $request)
    {
        $this->authorize('viewAny', Floor::class);

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search');
        $propertyId = $request->input('filter.property_id') ?? $request->input('property_id');

        $paginator = $this->service->paginate(
            ['name', 'code', 'property_id'],
            $perPage,
            $search,
            $propertyId,
            $request->boolean('with_trashed'),
            $request->user()
        );

        return FloorResource::collection($paginator);
    }

    /**
     * Danh sách tầng đã xóa (Thùng rác)
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', Floor::class);

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search');

        $floors = $this->service->paginateTrash(['property_id', 'name', 'code'], $perPage, $search, $request->user());

        return FloorResource::collection($floors);
    }

    /**
     * Tạo tầng mới
     */
    public function store(FloorStoreRequest $request)
    {
        $this->authorize('create', Floor::class);

        $floor = $this->service->create($request->validated(), $request->user());

        return new FloorResource($floor);
    }

    /**
     * Chi tiết tầng
     */
    public function show(string $id)
    {
        $floor = $this->service->find($id) ?? abort(404, 'Floor not found');

        $this->authorize('view', $floor);

        $floor->load('rooms');

        return new FloorResource($floor);
    }

    /**
     * Cập nhật tầng
     */
    public function update(FloorUpdateRequest $request, string $id)
    {
        $floor = $this->service->find($id) ?? abort(404, 'Floor not found');

        $this->authorize('update', $floor);

        $this->service->update($id, $request->validated());

        return new FloorResource($floor->refresh());
    }

    /**
     * Xóa tầng (Soft Delete)
     */
    public function destroy(string $id)
    {
        $floor = $this->service->find($id) ?? abort(404, 'Floor not found');

        $this->authorize('delete', $floor);

        $this->service->delete($id);

        return response()->noContent();
    }

    /**
     * Khôi phục tầng
     */
    public function restore(string $id)
    {
        $floor = $this->service->findTrashed($id) ?? abort(404, 'Floor not found in trash');

        $this->authorize('delete', $floor);

        $this->service->restore($id);

        return new FloorResource($floor);
    }

    /**
     * Xóa vĩnh viễn tầng
     */
    public function forceDelete(string $id)
    {
        $floor = $this->service->findWithTrashed($id) ?? abort(404, 'Floor not found');

        $this->authorize('delete', $floor);

        $this->service->forceDelete($id);

        return response()->noContent();
    }

    /**
     * Đồng bộ hóa bản vẽ mặt bằng
     *
     * Lưu trữ hàng loạt vị trí của các phòng trên bản vẽ mặt bằng.
     */
    public function syncFloorPlan(FloorPlanSyncRequest $request, string $id)
    {
        $floor = $this->service->find($id) ?? abort(404, 'Floor not found');

        // To map rooms, user must have authority to edit the floor.
        $this->authorize('update', $floor);

        $this->service->syncFloorPlanNodes($id, $request->input('nodes', []));

        return response()->json(['message' => 'Floor plan layout synchronized successfully.']);
    }

    /**
     * Tải lên ảnh bản vẽ mặt bằng
     *
     * Tải lên ảnh nền cho bản vẽ mặt bằng của tầng (hỗ trợ jpeg, png, webp, max 5MB).
     */
    public function uploadImage(FloorPlanImageUploadRequest $request, string $id)
    {
        $floor = $this->service->find($id) ?? abort(404, 'Floor not found');

        $this->authorize('update', $floor);

        $media = $this->service->uploadFloorPlanImage($id, $request->file('image'));

        return response()->json([
            'message' => 'Floor plan image uploaded successfully.',
            'url' => $media->getUrl(),
        ]);
    }
}
