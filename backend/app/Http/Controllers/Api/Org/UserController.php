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
            AllowedFilter::callback('property_id', function (Builder $query, $value) {
                $query->where(function ($q) use ($value) {
                    $q->whereHas('properties', function ($q2) use ($value) {
                        $q2->where('properties.id', $value);
                    })->orWhereHas('contractMembers.contract', function ($q2) use ($value) {
                        $q2->where('contracts.property_id', $value);
                    });
                });
            }),
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
            AllowedFilter::exact('property_id', 'properties.id'),
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

    /**
     * Kiểm tra email tồn tại trong hệ thống (dùng khi soạn hợp đồng)
     *
     * Trả về thông tin cơ bản của user nếu tìm thấy, null nếu chưa có tài khoản.
     * Endpoint này chỉ trả về id + snapshot fields, KHÔNG trả về thông tin nhạy cảm.
     */
    public function checkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = User::where('email', $request->email)
            ->whereNull('deleted_at')
            ->select(['id', 'full_name', 'phone', 'identity_number'])
            ->first();

        return response()->json(['data' => $user]); // null if not found — frontend checks this
    }
}
