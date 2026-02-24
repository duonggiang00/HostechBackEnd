<?php

namespace App\Http\Controllers\Api\Org;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Org\UserStoreRequest;
use App\Http\Requests\Org\UserUpdateRequest;
use App\Http\Requests\Org\UserIndexRequest;
use App\Http\Resources\Org\UserResource;
use App\Models\Org\User;
use Illuminate\Support\Facades\Hash;
use Spatie\QueryBuilder\QueryBuilder;

use App\Services\Org\UserService;

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
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['role', 'email', 'is_active'];
        $search = $request->input('search');

        $paginator = $this->service->paginate($allowed, $perPage, $search);

        return UserResource::collection($paginator)->response()->setStatusCode(200);
    }
    
    /**
     * Danh sách người dùng đã xóa (Thùng rác)
     * 
     * Lấy danh sách người dùng đã bị xóa tạm thời.
     * 
     * @queryParam per_page int Số lượng bản ghi mỗi trang. Example: 10
     * @queryParam page int Trang hiện tại. Example: 1
     * @queryParam search string Từ khóa tìm kiếm. Example: John
     * @queryParam filter[role] string Quyền hạn (ADMIN, MANAGER, STAFF, TENANT). Example: STAFF
     * @queryParam filter[email] string Email. Example: test@example.com
     * @queryParam filter[is_active] boolean Trạng thái hoạt động. Example: 1
     * @queryParam sort string Sắp xếp (full_name, email, created_at). Example: -created_at
     */
    public function trash(Request $request) 
    {
        $this->authorize('viewAny', User::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        // Use Service for consistent logic
        $allowed = ['role', 'email', 'is_active'];
        $search = $request->input('search');

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

        return UserResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Tạo người dùng mới
     * 
     * Tạo một tài khoản người dùng mới. Yêu cầu quyền Admin hoặc Owner.
     */
    public function store(UserStoreRequest $request)
    {
        $this->authorize('create', User::class);

        $currentUser = $request->user();
        $data = $request->validated();
        
        // Security: Enforce Org Scope & Role Hierarchy
        if (! $currentUser->hasRole('Admin')) {
            // 1. Force Org ID to be current user's Org
            if (isset($data['org_id']) && (string)$data['org_id'] !== (string)$currentUser->org_id) {
               return response()->json(['message' => 'Unauthorized: You cannot create users in another organization.'], 403);
            }
            $data['org_id'] = $currentUser->org_id;

            // 2. Restrict Role Assignment (Owner cannot create Admin or other Owners)
            $allowedRoles = ['MANAGER', 'STAFF', 'TENANT'];
            if (! in_array($data['role'], $allowedRoles)) {
                return response()->json(['message' => 'Unauthorized: You cannot create users with this role.'], 403);
            }
        } else {
            // Admin Logic: Allow X-Org-Id header overrides
            if (request()->hasHeader('X-Org-Id')) {
                $data['org_id'] = request()->header('X-Org-Id');
            }
        }

        $data['password_hash'] = Hash::make($data['password']);
        unset($data['password'], $data['password_confirmation']);

        $user = $this->service->create($data);

        return new UserResource($user);
    }

    /**
     * Chi tiết người dùng
     * 
     * Xem thông tin chi tiết của một người dùng cụ thể.
     */
    public function show(string $id)
    {
        $user = $this->service->find($id);
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
        $user = $this->service->find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $user);

        $currentUser = $request->user();
        $data = $request->validated();

        // Security: Enforce Org Scope & Role Hierarchy
        if (! $currentUser->hasRole('Admin')) {
            // 1. Prevent moving user to another org
            if (isset($data['org_id']) && (string)$data['org_id'] !== (string)$currentUser->org_id) {
               return response()->json(['message' => 'Unauthorized: You cannot move users to another organization.'], 403);
            }
            
            // 2. Restrict Role Assignment
            if (isset($data['role'])) {
                $allowedRoles = ['MANAGER', 'STAFF', 'TENANT'];
                if (! in_array($data['role'], $allowedRoles)) {
                    return response()->json(['message' => 'Unauthorized: You cannot assign this role.'], 403);
                }
            }
        } else {
             // Admin Logic...
        }
        if (isset($data['password'])) {
            $data['password_hash'] = Hash::make($data['password']);
            unset($data['password'], $data['password_confirmation']);
        }

        $this->service->update($id, $data); // Service update returns updated model or bool? Checked: returns ?User.

        // Re-fetch or use returned
        return new UserResource($user->refresh());
    }

    /**
     * Xóa người dùng (Soft Delete)
     * 
     * Đưa tài khoản vào thùng rác tạm thời. Có thể khôi phục sau này.
     */
    public function destroy(string $id)
    {
        $user = $this->service->find($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục người dùng
     * 
     * Khôi phục tài khoản đã bị xóa tạm thời.
     */
    public function restore(string $id)
    {
        $user = $this->service->findTrashed($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $this->service->restore($id);

        return new UserResource($user);
    }

    /**
     * Xóa vĩnh viễn người dùng
     * 
     * Xóa hoàn toàn tài khoản khỏi hệ thống. Không thể khôi phục.
     */
    public function forceDelete(string $id)
    {
        $user = $this->service->findWithTrashed($id);
        if (! $user) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $user);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }
}
