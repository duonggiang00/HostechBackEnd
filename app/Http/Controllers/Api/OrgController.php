<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrgStoreRequest;
use App\Http\Requests\OrgUpdateRequest;
use App\Http\Resources\OrgResource;
use App\Models\Org;

use Illuminate\Http\Request;
use App\Http\Requests\OrgIndexRequest;
use Dedoc\Scramble\Attributes\Group;
use App\Services\PropertyService;
use App\Http\Resources\PropertyResource;
use App\Services\UserService; // Added
use App\Services\OrgService; // Added
use App\Http\Resources\UserResource; // Added
use App\Http\Requests\PropertyIndexRequest;
use App\Http\Requests\UserIndexRequest;

/**
 * Quản lý Tổ chức (Organizations)
 * 
 * API quản lý các tổ chức/công ty trong hệ thống.
 * Mỗi tổ chức có thể chứa nhiều Property (Bất động sản).
 */
#[Group('Tổ chức & Người dùng')]
class OrgController extends Controller
{
    public function __construct(
        protected OrgService $service,
        protected PropertyService $propertyService,
        protected UserService $userService
    ) {}

    /**
     * Danh sách tổ chức
     * 
     * Lấy danh sách các tổ chức.
     */
    public function index(OrgIndexRequest $request)
    {
         $this->authorize('viewAny', Org::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = ['name', 'email', 'phone'];
        $search = $request->input('search');

        $paginator = $this->service->paginate($allowed, $perPage, $search);

        return OrgResource::collection($paginator)->response()->setStatusCode(200);
    }
    
    // ...

    /**
     * Chi tiết tổ chức
     * 
     * Lấy thông tin chi tiết của một tổ chức, bao gồm danh sách Property.
     * 
     * @queryParam per_page int Số lượng Property trên một trang. Mặc định 15. Example: 10
     * @queryParam page int Trang hiện tại của danh sách Property. Example: 1
     * @queryParam search string Từ khóa tìm kiếm Property (tên, mã). Example: Building A
     */
    public function show(Request $request, string $id)
    {
        $org = $this->service->find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $org);

        $org->loadCount(['properties', 'users']);

        return new OrgResource($org);
    }

    /**
     * Cập nhật tổ chức
     * 
     * Cập nhật thông tin tổ chức.
     */
    public function update(OrgUpdateRequest $request, string $id)
    {
        $org = $this->service->find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $org);

        $this->service->update($id, $request->validated());

        return new OrgResource($org->refresh());
    }

    /**
     * Danh sách tổ chức đã xóa (Thùng rác)
     * 
     * Lấy danh sách các tổ chức đã bị xóa tạm thời (Soft Delete).
     * 
     */
    public function trash(OrgIndexRequest $request)
    {
        $this->authorize('viewAny', Org::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $allowed = ['name', 'email', 'phone'];
        $search = $request->input('search');

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

        return OrgResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Khôi phục tổ chức
     */
    public function restore(string $id)
    {
        $org = $this->service->findTrashed($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $org);

        $this->service->restore($id);

        return new OrgResource($org);
    }

    /**
     * Xóa tổ chức (Soft Delete)
     * 
     * Đưa tổ chức vào thùng rác tạm thời.
     */
    public function destroy(string $id)
    {
        $org = $this->service->find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $org);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Xóa vĩnh viễn tổ chức
     */
    public function forceDelete(string $id)
    {
        $org = $this->service->findWithTrashed($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $org);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully']);
    }

    /**
     * Danh sách Property của tổ chức
     * 
     * Lấy danh sách Property thuộc về tổ chức này.
     */
    public function properties(PropertyIndexRequest $request, string $id)
    {
        $org = Org::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $org);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;
        $search = $request->input('search');

        $paginator = $this->propertyService->paginate(['name', 'code'], $perPage, $search, $org->id);

        return PropertyResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách người dùng của tổ chức
     * 
     * Lấy danh sách người dùng thuộc về tổ chức này.
     */
    public function users(UserIndexRequest $request, string $id)
    {
        $org = Org::find($id);
        if (! $org) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $org);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;
        $search = $request->input('search');

        $paginator = $this->userService->paginate(['full_name', 'email'], $perPage, $search, $org->id);

        return UserResource::collection($paginator)->response()->setStatusCode(200);
    }
}
