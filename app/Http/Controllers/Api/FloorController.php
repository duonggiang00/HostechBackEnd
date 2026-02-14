<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\FloorStoreRequest;
use App\Http\Requests\FloorUpdateRequest;
use App\Http\Requests\FloorIndexRequest;
use App\Http\Resources\FloorResource;
use App\Models\Floor;
use Spatie\QueryBuilder\QueryBuilder;

use App\Services\FloorService;
use Spatie\QueryBuilder\AllowedFilter;

/**
 * Quản lý Tầng (Floors)
 * 
 * API quản lý các tầng trong một tòa nhà (Property).
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


    /**
     * Danh sách tầng
     * 
     * Lấy danh sách các tầng. Hỗ trợ lọc theo Property.
     */
    public function index(FloorIndexRequest $request)
    {
        $this->authorize('viewAny', Floor::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = [
            AllowedFilter::exact('property_id'),
            'name', 
            'code'
        ];
        $search = $request->input('search');

        $paginator = $this->service->paginate($allowed, $perPage, $search);

        return FloorResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách tầng đã xóa (Thùng rác)
     * 
     * Lấy danh sách các tầng đã bị xóa tạm thời (Soft Delete).
     */
    public function trash(FloorIndexRequest $request)
    {
        $this->authorize('viewAny', Floor::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = ['property_id', 'name', 'code'];
        $search = $request->input('search');

        $floors = $this->service->paginateTrash($allowed, $perPage, $search);

        return FloorResource::collection($floors)->response()->setStatusCode(200);
    }

    /**
     * Tạo tầng mới
     * 
     * Thêm một tầng mới vào hệ thống.
     */
    public function store(FloorStoreRequest $request)
    {
        $this->authorize('create', Floor::class);

        $data = $request->validated();
        $user = $request->user();

        $property = \App\Models\Property::find($data['property_id']);
        if (! $property) {
             return response()->json(['message' => 'Property not found'], 404);
        }

        // Security: Check if Property belongs to User's Org (if not Admin)
        if (! $user->hasRole('Admin') && $user->org_id && (string)$property->org_id !== (string)$user->org_id) {
             return response()->json(['message' => 'Unauthorized: You cannot add floors to a property in another organization.'], 403);
        }
        
        // Auto-assign org_id from Property (secure now)
        $data['org_id'] = $property->org_id;

        $floor = $this->service->create($data);

        return new FloorResource($floor);
    }

    /**
     * Chi tiết tầng
     * 
     * Xem thông tin chi tiết của một tầng, bao gồm danh sách phòng.
     */
    public function show(string $id)
    {
        $floor = $this->service->find($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $floor);

        $floor->load('rooms');

        return new FloorResource($floor);
    }

    /**
     * Cập nhật tầng
     * 
     * Cập nhật thông tin của một tầng.
     */
    public function update(FloorUpdateRequest $request, string $id)
    {
        $floor = $this->service->find($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $floor);

        $this->service->update($id, $request->validated());

        return new FloorResource($floor->refresh());
    }

    /**
     * Xóa tầng (Soft Delete)
     * 
     * Đưa tầng vào thùng rác tạm thời.
     */
    public function destroy(string $id)
    {
        $floor = $this->service->find($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $floor);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục tầng
     * 
     * Khôi phục tầng đã bị xóa tạm thời.
     */
    public function restore(string $id)
    {
        $floor = $this->service->findTrashed($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $floor);

        $this->service->restore($id);

        return new FloorResource($floor);
    }

    /**
     * Xóa vĩnh viễn tầng
     * 
     * Xóa hoàn toàn tầng khỏi hệ thống. Không thể khôi phục.
     */
    public function forceDelete(string $id)
    {
        $floor = $this->service->findWithTrashed($id);
        if (! $floor) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $floor);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
