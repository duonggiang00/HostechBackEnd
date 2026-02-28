<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractIndexRequest;
use App\Http\Requests\Contract\ContractStoreRequest;
use App\Http\Requests\Contract\ContractUpdateRequest;
use App\Http\Resources\Contract\ContractResource;
use App\Models\Contract\Contract;
use App\Services\Contract\ContractService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Quản lý Hợp đồng (Contracts)
 * 
 * API quản lý hợp đồng thuê và cư dân.
 */
#[Group('Quản lý Hợp đồng')]
class ContractController extends Controller
{
    public function __construct(protected ContractService $service) {}

    /**
     * Danh sách hợp đồng
     * 
     * Lấy danh sách hợp đồng. Hỗ trợ lọc theo Property, Room, Status.
     */
    public function index(ContractIndexRequest $request)
    {
        $this->authorize('viewAny', Contract::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['property_id', 'room_id', 'status', 'start_date_after'];
        $search = $request->input('search');

        // Security: Filter by Org for non-Admin
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginate($allowed, $perPage, $search, $orgId);

        return ContractResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Danh sách hợp đồng đã xóa (Thùng rác)
     * 
     * @queryParam per_page int Số lượng bản ghi mỗi trang. Example: 10
     * @queryParam page int Trang hiện tại. Example: 1
     * @queryParam search string Từ khóa tìm kiếm.
     * @queryParam filter[property_id] string ID Bất động sản.
     * @queryParam filter[room_id] string ID Phòng.
     * @queryParam filter[status] string Trạng thái.
     * @queryParam sort string Sắp xếp.
     */
    public function trash(Request $request)
    {
        $this->authorize('viewAny', Contract::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) $perPage = 15;

        $allowed = ['property_id', 'room_id', 'status'];
        $search = $request->input('search');
        
        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id') : $user->org_id;

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search, $orgId);

        return ContractResource::collection($paginator)->response()->setStatusCode(200);
    }

    /**
     * Tạo hợp đồng mới
     */
    public function store(ContractStoreRequest $request)
    {
        $this->authorize('create', Contract::class);

        $data = $request->validated();
        
        // Auto-assign org_id from user
        $user = $request->user();
        if (! $user->hasRole('Admin') && $user->org_id) {
            $data['org_id'] = $user->org_id;
        } else {
             // Admin might provide org_id? For now assume admin acts in context of their org or passed org_id?
             // Simplification: Contract must belong to same org as property/room.
             // We can fetch org_id from room_id if not present.
             // But let's trust validations or service helper.
             // Service handles creation.
             if (!isset($data['org_id'])) {
                  $room = \App\Models\Property\Room::find($data['room_id']);
                  $data['org_id'] = $room->org_id;
             }
        }
        $data['created_by_user_id'] = $user->id;

        $contract = $this->service->create($data);

        return new ContractResource($contract);
    }

    /**
     * Chi tiết hợp đồng
     */
    public function show(string $id)
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('view', $contract);

        return new ContractResource($contract);
    }

    /**
     * Cập nhật hợp đồng
     */
    public function update(ContractUpdateRequest $request, string $id)
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('update', $contract);

        $updated = $this->service->update($id, $request->validated());

        return new ContractResource($updated);
    }

    /**
     * Xóa hợp đồng (Soft Delete)
     */
    public function destroy(string $id)
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('delete', $contract);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục hợp đồng
     */
    public function restore(string $id)
    {
        $contract = $this->service->findTrashed($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('restore', $contract);

        $this->service->restore($id);

        return new ContractResource($contract);
    }

    /**
     * Xóa vĩnh viễn hợp đồng
     */
    public function forceDelete(string $id)
    {
        $contract = $this->service->findWithTrashed($id);
        if (! $contract) {
            return response()->json(['message' => 'Not Found'], 404);
        }

        $this->authorize('forceDelete', $contract);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully'], 200);
    }

    /**
     * Hợp đồng chờ ký của tôi (Dành cho Tenant)
     * 
     * Liệt kê các hợp đồng mà user hiện tại đang được gán nhưng chưa xác nhận.
     */
    public function myPendingContracts(Request $request)
    {
        $user = $request->user();

        $pendingContracts = Contract::whereHas('members', function($q) use ($user) {
            $q->where('user_id', $user->id)
              ->where('status', 'PENDING');
        })->with('property:id,name', 'room:id,code,name')->get();

        // Ẩn bớt các dữ liệu nhạy cảm chưa dành cho Tenant lúc chờ ký
        $pendingContracts->makeHidden(['join_code', 'meta']);

        return response()->json([
            'data' => $pendingContracts
        ]);
    }

    /**
     * Xác nhận ký hợp đồng
     * 
     * Tenant đồng ý và tiến hành tham gia hợp đồng.
     * Chỉ hoạt động khi user hiện tại là thành viên PENDING của hợp đồng này.
     */
    public function acceptSignature(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);
        $user = $request->user();

        // Security: User phải là PENDING member của contract này
        $member = \App\Models\Contract\ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->first();

        if (!$member) {
            return response()->json([
                'message' => 'Bạn không có quyền hoặc hợp đồng này không ở trạng thái chờ ký.'
            ], 403);
        }

        // Cập nhật trạng thái member → APPROVED
        $member->update([
            'status' => 'APPROVED',
            'joined_at' => now(),
        ]);

        // Tự động chuyển hợp đồng → ACTIVE nếu đang ở DRAFT
        if (in_array($contract->status, ['DRAFT', 'PENDING_SIGNATURE'])) {
            $contract->update([
                'status' => 'ACTIVE',
                'signed_at' => now(),
            ]);
        }

        return response()->json(['message' => 'Đã xác nhận hợp đồng thành công.']);
    }

    /**
     * Từ chối hợp đồng
     * 
     * Tenant từ chối tham gia hợp đồng.
     * Chỉ hoạt động khi user hiện tại là thành viên PENDING của hợp đồng này.
     */
    public function rejectSignature(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);
        $user = $request->user();

        // Security: User phải là PENDING member của contract này
        $member = \App\Models\Contract\ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'PENDING')
            ->first();

        if (!$member) {
            return response()->json([
                'message' => 'Bạn không có quyền thao tác trên hợp đồng này.'
            ], 403);
        }

        $member->update(['status' => 'REJECTED']);

        return response()->json(['message' => 'Đã từ chối hợp đồng.']);
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  TENANT SELF-SERVICE
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Thêm thành viên vào hợp đồng (Tenant mời bạn cùng phòng)
     *
     * Tenant đang là thành viên APPROVED của hợp đồng có thể mời thêm người khác.
     * Thành viên mới sẽ ở trạng thái PENDING cho đến khi họ tự xác nhận.
     *
     * @bodyParam full_name string required Họ tên người được mời. Example: Nguyễn Văn B
     * @bodyParam phone string Số điện thoại. Example: 0901234567
     * @bodyParam user_id string UUID của tài khoản (nếu đã có). Example: uuid-here
     * @bodyParam role string Vai trò trong hợp đồng: TENANT, ROOMMATE, GUARANTOR. Example: ROOMMATE
     */
    public function addMember(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);
        $this->authorize('addMember', $contract);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'nullable|string|max:20',
            'identity_number' => 'nullable|string|max:50',
            'user_id' => 'nullable|uuid|exists:users,id',
            'role' => 'nullable|in:TENANT,ROOMMATE,GUARANTOR',
        ]);

        $member = \App\Models\Contract\ContractMember::create([
            'org_id' => $contract->org_id,
            'contract_id' => $contract->id,
            'user_id' => $validated['user_id'] ?? null,
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'] ?? null,
            'identity_number' => $validated['identity_number'] ?? null,
            'role' => $validated['role'] ?? 'ROOMMATE',
            'status' => 'PENDING',
            'is_primary' => false,
        ]);

        return response()->json([
            'message' => 'Đã gửi yêu cầu thêm thành viên.',
            'data' => $member,
        ], 201);
    }

    /**
     * Danh sách phòng trống cùng Tòa nhà (để xem trước khi xin đổi phòng)
     *
     * Tenant có hợp đồng ACTIVE tại Tòa nhà có thể xem danh sách phòng trống (AVAILABLE)
     * trong cùng Property, phục vụ mục đích xin đổi phòng.
     */
    public function availableRooms(Request $request, string $id)
    {
        $contract = Contract::with('property')->findOrFail($id);
        $user = $request->user();

        // Xác minh user là thành viên APPROVED của hợp đồng này
        $isMember = \App\Models\Contract\ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'APPROVED')
            ->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'Bạn không phải thành viên của hợp đồng này.'
            ], 403);
        }

        // Lấy phòng AVAILABLE cùng property, loại trừ phòng hiện tại
        $rooms = \App\Models\Property\Room::where('property_id', $contract->property_id)
            ->where('status', 'AVAILABLE')
            ->where('id', '!=', $contract->room_id)
            ->select(['id', 'code', 'name', 'type', 'area', 'base_price', 'floor', 'capacity'])
            ->get();

        return response()->json([
            'data' => $rooms,
            'current_room_id' => $contract->room_id,
            'property_name' => $contract->property->name ?? null,
        ]);
    }

    /**
     * Xin đổi phòng (Room Transfer Request)
     *
     * Tenant gửi yêu cầu đổi sang phòng khác trong cùng Tòa nhà.
     * Manager / Owner phê duyệt / từ chối yêu cầu này.
     *
     * @bodyParam target_room_id string required UUID phòng muốn chuyển sang. Example: uuid-here
     * @bodyParam reason string Lý do muốn đổi phòng. Example: Phòng quá nhỏ cho 2 người
     */
    public function roomTransferRequest(Request $request, string $id)
    {
        $contract = Contract::findOrFail($id);
        $user = $request->user();

        // Xác minh user là thành viên APPROVED
        $isMember = \App\Models\Contract\ContractMember::where('contract_id', $contract->id)
            ->where('user_id', $user->id)
            ->where('status', 'APPROVED')
            ->exists();

        if (!$isMember) {
            return response()->json([
                'message' => 'Bạn không phải thành viên của hợp đồng này.'
            ], 403);
        }

        $validated = $request->validate([
            'target_room_id' => 'required|uuid|exists:rooms,id',
            'reason' => 'nullable|string|max:1000',
        ]);

        // Kiểm tra phòng đích có cùng property và đang AVAILABLE
        $targetRoom = \App\Models\Property\Room::where('id', $validated['target_room_id'])
            ->where('property_id', $contract->property_id)
            ->where('status', 'AVAILABLE')
            ->first();

        if (!$targetRoom) {
            return response()->json([
                'message' => 'Phòng đích không hợp lệ hoặc không còn trống.'
            ], 422);
        }

        // Lưu yêu cầu đổi phòng vào trường meta của hợp đồng
        $transferRequests = $contract->meta['transfer_requests'] ?? [];
        $transferRequests[] = [
            'requested_by' => $user->id,
            'from_room_id' => $contract->room_id,
            'to_room_id' => $validated['target_room_id'],
            'reason' => $validated['reason'] ?? null,
            'status' => 'PENDING',
            'requested_at' => now()->toISOString(),
        ];

        $contract->update([
            'meta' => array_merge($contract->meta ?? [], ['transfer_requests' => $transferRequests])
        ]);

        return response()->json([
            'message' => 'Đã gửi yêu cầu đổi phòng thành công. Quản lý sẽ xem xét trong thời gian sớm nhất.',
            'target_room' => [
                'id' => $targetRoom->id,
                'code' => $targetRoom->code,
                'name' => $targetRoom->name,
            ],
        ]);
    }
}
