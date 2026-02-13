<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\OrgStoreRequest;
use App\Http\Requests\OrgUpdateRequest;
use App\Http\Resources\OrgResource;
use App\Models\Org;

use Dedoc\Scramble\Attributes\Group; // Added

/**
 * Quản lý Tổ chức (Organizations)
 * 
 * API quản lý các tổ chức/công ty trong hệ thống.
 * Mỗi tổ chức có thể chứa nhiều Property (Bất động sản).
 */
#[Group('Tổ chức & Người dùng')]
class OrgController extends Controller
{
    /**
     * Danh sách tổ chức
     * 
     * Lấy danh sách các tổ chức.
     */
    public function index()
    {
         $this->authorize('viewAny', Org::class);

        $query = Org::query();

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $orgs = $query->paginate(15);

        return OrgResource::collection($orgs)->response()->setStatusCode(200);
    }

    /**
     * Tạo tổ chức mới
     * 
     * Chỉ Admin/SuperAdmin mới có quyền tạo tổ chức.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Org::class);

        $org = Org::create($request->validated());

        return new OrgResource($org);
    }

    /**
     * Chi tiết tổ chức
     */
    public function show(string $id)
    {
        $org = Org::find($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('view', $org);

        return new OrgResource($org);
    }

    /**
     * Cập nhật tổ chức
     */
    public function update(Request $request, string $id)
    {
        $org = Org::find($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('update', $org);
        
        $org->update($request->all());

        return new OrgResource($org);
    }

    /**
     * Xóa tổ chức (Soft Delete)
     */
    public function destroy(string $id)
    {
        $org = Org::find($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $org);

        $org->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Khôi phục tổ chức
     */
    public function restore(string $id)
    {
        $org = Org::onlyTrashed()->find($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $org);

        $org->restore();

        return new OrgResource($org);
    }

    /**
     * Xóa vĩnh viễn tổ chức
     */
    public function forceDelete(string $id)
    {
        $org = Org::withTrashed()->find($id);
        if (! $org) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $org);

        $org->forceDelete();

        return response()->json(['message' => 'Permanently deleted successfully']);
    }
}
