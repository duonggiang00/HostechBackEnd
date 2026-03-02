<?php

namespace App\Http\Controllers\Api\Org;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\UserIndexRequest;
use App\Http\Requests\Org\UserStoreRequest;
use App\Http\Requests\Org\UserUpdateRequest;
use App\Http\Resources\Org\UserResource;
use App\Models\Org\User;
use App\Services\Org\UserService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;

/**
 * Quản lý Người dùng
 *
 * API cho phép quản lý tài khoản người dùng trong hệ thống.
 * Bao gồm các chức năng tạo, xem, sửa, xóa và khôi phục tài khoản.
 */
#[Group('Tổ chức & Người dùng')]
class UserController extends Controller
{
    public function __construct(protected UserService $service) {}

    /**
     * Danh sách người dùng
     *
     * Lấy danh sách người dùng có hỗ trợ phân trang và tìm kiếm.
     */
    public function index(UserIndexRequest $request)
    {
        $this->authorize('viewAny', User::class);

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search');
        $allowed = [
            AllowedFilter::callback('role', function (Builder $query, $value) {
                $query->whereHas('roles', function (Builder $q) use ($value) {
                    $q->where('name', 'like', "%{$value}%");
                });
            }),
            'email',
            'is_active',
        ];

        $paginator = $this->service->paginate($allowed, $perPage, $search, null, $request->boolean('with_trashed'));

        return UserResource::collection($paginator);
    }

    /**
     * Danh sách người dùng đã xóa (Thùng rác)
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $perPage = (int) $request->input('per_page', 15);
        $search = $request->input('search');
        $allowed = [
            AllowedFilter::callback('role', function (Builder $query, $value) {
                $query->whereHas('roles', function (Builder $q) use ($value) {
                    $q->where('name', 'like', "%{$value}%");
                });
            }),
            'email',
            'is_active',
        ];

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

        return UserResource::collection($paginator);
    }

    /**
     * Tạo người dùng mới
     */
    public function store(UserStoreRequest $request)
    {
        $this->authorize('create', User::class);

        $user = $this->service->create($request->validated(), $request->user());

        return new UserResource($user);
    }

    /**
     * Chi tiết người dùng
     */
    public function show(string $id)
    {
        $user = $this->service->find($id) ?? abort(404, 'User not found');

        $this->authorize('view', $user);

        return new UserResource($user);
    }

    /**
     * Cập nhật người dùng
     */
    public function update(UserUpdateRequest $request, string $id)
    {
        $user = $this->service->find($id) ?? abort(404, 'User not found');

        $this->authorize('update', $user);

        $updated = $this->service->update($id, $request->validated(), $request->user());

        return new UserResource($updated);
    }

    /**
     * Xóa người dùng (Soft Delete)
     */
    public function destroy(string $id)
    {
        $user = $this->service->find($id) ?? abort(404, 'User not found');

        $this->authorize('delete', $user);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Khôi phục người dùng
     */
    public function restore(string $id)
    {
        $user = $this->service->findTrashed($id) ?? abort(404, 'User not found in trash');

        $this->authorize('delete', $user);

        $this->service->restore($id);

        return new UserResource($user);
    }

    /**
     * Xóa vĩnh viễn người dùng
     */
    public function forceDelete(string $id)
    {
        $user = $this->service->findWithTrashed($id) ?? abort(404, 'User not found');

        $this->authorize('delete', $user);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully']);
    }
}
