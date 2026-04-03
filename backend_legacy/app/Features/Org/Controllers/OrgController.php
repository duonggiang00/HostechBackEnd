<?php

namespace App\Features\Org\Controllers;

use App\Features\Org\Services\OrgService;
use App\Features\Org\Services\UserService;
use App\Features\Property\Resources\PropertyResource;
use App\Features\Property\Services\PropertyService;
use App\Features\Service\Services\ServiceService;
use App\Http\Controllers\Controller;
use App\Features\Org\Requests\OrgIndexRequest;
use App\Features\Org\Requests\OrgStoreRequest;
use App\Features\Org\Requests\OrgUpdateRequest;
use App\Features\Org\Requests\UserIndexRequest;
use App\Features\Property\Requests\PropertyIndexRequest;
use App\Features\Service\Requests\ServiceIndexRequest;
use App\Features\Org\Resources\OrgResource;
use App\Features\Org\Resources\UserResource;

use App\Features\Service\Resources\ServiceResource; 
use App\Features\Org\Models\Org; 



use Dedoc\Scramble\Attributes\Group;

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
        protected UserService $userService,
        protected ServiceService $serviceService
    ) {}

    /**
     * Danh sách tổ chức
     *
     * Lấy danh sách các tổ chức.
     */
    public function index(OrgIndexRequest $request)
    {
        $user = auth()->user();
        if (! $user->hasRole('Admin') && ! $user->org_id) {
            $this->authorize('viewAny', Org::class);
        }

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search');
        $allowed = ['name', 'email', 'phone'];

        $paginator = $this->service->paginate($allowed, $perPage, $search, $request->boolean('with_trashed'), $user);

        return OrgResource::collection($paginator);
    }

    /**
     * Tạo mới tổ chức
     */
    public function store(OrgStoreRequest $request)
    {
        $this->authorize('create', Org::class);

        $org = $this->service->create($request->validated());

        return new OrgResource($org);
    }

    /**
     * Chi tiết tổ chức
     */
    public function show(string $id)
    {
        $org = $this->service->find($id) ?? abort(404, 'Organization not found');

        $this->authorize('view', $org);

        $org->loadCount(['properties', 'users']);

        return new OrgResource($org);
    }

    /**
     * Cập nhật tổ chức
     */
    public function update(OrgUpdateRequest $request, string $id)
    {
        $org = $this->service->find($id) ?? abort(404, 'Organization not found');

        $this->authorize('update', $org);

        $this->service->update($id, $request->validated());

        return new OrgResource($org->refresh());
    }

    /**
     * Danh sách tổ chức đã xóa (Thùng rác)
     */
    public function trash(OrgIndexRequest $request)
    {
        $this->authorize('viewAny', Org::class);

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search');
        $allowed = ['name', 'email', 'phone'];

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

        return OrgResource::collection($paginator);
    }

    /**
     * Khôi phục tổ chức
     */
    public function restore(string $id)
    {
        $org = $this->service->findTrashed($id) ?? abort(404, 'Organization not found in trash');

        $this->authorize('delete', $org);

        $this->service->restore($id);

        return new OrgResource($org);
    }

    /**
     * Xóa tổ chức (Soft Delete)
     */
    public function destroy(string $id)
    {
        $org = $this->service->find($id) ?? abort(404, 'Organization not found');

        $this->authorize('delete', $org);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Xóa vĩnh viễn tổ chức
     */
    public function forceDelete(string $id)
    {
        $org = $this->service->findWithTrashed($id) ?? abort(404, 'Organization not found');

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
        $org = $this->service->find($id);
        if (! $org) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $org);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }
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
        $org = $this->service->find($id);
        if (! $org) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $org);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }
        $search = $request->input('search');

        $paginator = $this->userService->paginate(['full_name', 'email'], $perPage, $search, $org->id);

        return UserResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách dịch vụ của tổ chức
     *
     * Lấy danh sách dịch vụ thuộc về tổ chức này.
     */
    public function services(ServiceIndexRequest $request, string $id)
    {
        $org = $this->service->find($id);
        if (! $org) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $org);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }
        $search = $request->input('search');
        $allowed = ['code', 'name', 'is_active', 'unit'];

        $paginator = $this->serviceService->paginate($allowed, $perPage, $search, $org->id);

        return ServiceResource::collection($paginator)->response()->setStatusCode(200);
    }
}
