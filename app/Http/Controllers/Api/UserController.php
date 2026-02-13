<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\QueryBuilder\QueryBuilder;

use Dedoc\Scramble\Attributes\Group; // Added

/**
 * Quản lý Người dùng
 * 
 * API cho phép quản lý tài khoản người dùng trong hệ thống.
 * Bao gồm các chức năng tạo, xem, sửa, xóa và khôi phục tài khoản.
 */
#[Group('Tổ chức & Người dùng')]
class UserController extends Controller
{
    /**
     * Danh sách người dùng
     * 
     * Lấy danh sách người dùng có hỗ trợ phân trang và tìm kiếm.
     */
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $query = QueryBuilder::for(User::class)
            ->allowedFilters(['role', 'email', 'is_active'])
            ->defaultSort('full_name');

        if (request()->boolean('with_trashed')) {
            $query->withTrashed();
        }

        return UserResource::collection($query->paginate(15))->response()->setStatusCode(200);
    }

    /**
     * Tạo người dùng mới
     * 
     * Tạo một tài khoản người dùng mới. Yêu cầu quyền Admin hoặc Owner.
     */
    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $data = $request->validated();
        $data['password_hash'] = Hash::make($data['password']);
        $data['org_id'] = request()->header('X-Org-Id');
        unset($data['password'], $data['password_confirmation']);

        $user = User::create($data);

        return new UserResource($user);
    }

    /**
     * Chi tiết người dùng
     * 
     * Xem thông tin chi tiết của một người dùng cụ thể.
     */
    public function show(string $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $user);

        return new UserResource($user);
    }

    /**
     * Cập nhật người dùng
     * 
     * Cập nhật thông tin tài khoản người dùng.
     */
    public function update(UserUpdateRequest $request, string $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $user);

        $data = $request->validated();
        if (isset($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password'], $data['password_confirmation']);
        }

        $user->update($data);

        return new UserResource($user);
    }

    /**
     * Xóa người dùng (Soft Delete)
     * 
     * Đưa tài khoản vào thùng rác tạm thời. Có thể khôi phục sau này.
     */
    public function destroy(string $id)
    {
        $user = User::find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $user->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục người dùng
     * 
     * Khôi phục tài khoản đã bị xóa tạm thời.
     */
    public function restore(string $id)
    {
        $user = User::onlyTrashed()->find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $user->restore();

        return new UserResource($user);
    }

    /**
     * Xóa vĩnh viễn người dùng
     * 
     * Xóa hoàn toàn tài khoản khỏi hệ thống. Không thể khôi phục.
     */
    public function forceDelete(string $id)
    {
        $user = User::withTrashed()->find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $user->forceDelete();

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
