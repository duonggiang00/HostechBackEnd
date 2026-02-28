<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractMemberStoreRequest;
use App\Http\Requests\Contract\ContractMemberUpdateRequest;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Services\Contract\ContractService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Thành viên hợp đồng
 * 
 * APIs thao tác trực tiếp danh sách người thuê nhà trong một hợp đồng.
 */
#[Group('Quản lý Hợp đồng')]
class ContractMemberController extends Controller
{
    public function __construct(protected ContractService $service) {}

    /**
     * Danh sách khách thuê
     * 
     * Lấy toàn bộ thành viên đang và đã từng ở trong hợp đồng.
     */
    public function index(Request $request, string $contractId)
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            return response()->json(['message' => 'Contract Not Found'], 404);
        }

        $this->authorize('view', $contract);

        // Optional filtering by active only, etc.
        $members = $contract->members; 

        return response()->json(['data' => $members]);
    }

    /**
     * Thêm khách mới
     * 
     * Khai báo thêm thành viên vào một hợp đồng đang tồn tại mà không cần thiết lập tài khoản User trước.
     */
    public function store(ContractMemberStoreRequest $request, string $contractId)
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            return response()->json(['message' => 'Contract Not Found'], 404);
        }

        $this->authorize('addMember', [Contract::class, $contract]);

        $memberData = $request->validated();
        $user = $request->user();

        // If the user has 'update Contracts' permission, they are Staff/Manager/Owner -> Approved by default
        if ($user->hasPermissionTo('update Contracts')) {
            $memberData['status'] = 'APPROVED';
        } else {
            // Otherwise, they are a Tenant requesting to add a roommate -> Pending approval
            $memberData['status'] = 'PENDING';
            $memberData['joined_at'] = null; // Wait until approved
        }

        $member = $this->service->addMember($contract, $memberData);

        return response()->json(['data' => $member], 201);
    }

    /**
     * Xem chi tiết một khách
     */
    public function show(string $contractId, string $memberId)
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            return response()->json(['message' => 'Contract Not Found'], 404);
        }

        $this->authorize('view', $contract);

        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return response()->json(['message' => 'Member Not Found'], 404);
        }

        return response()->json(['data' => $member]);
    }

    /**
     * Cập nhật khách
     * 
     * Cập nhật thông tin CCCD, sđt hoặc vai trò (Role) của người dùng trong khoảng thời gian hợp đồng.
     */
    public function update(ContractMemberUpdateRequest $request, string $contractId, string $memberId)
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            return response()->json(['message' => 'Contract Not Found'], 404);
        }

        $this->authorize('update', $contract);

        $updated = $this->service->updateMember($contractId, $memberId, $request->validated());
        
        if (! $updated) {
            return response()->json(['message' => 'Member Not Found'], 404);
        }

        return response()->json(['data' => $updated]);
    }

    /**
     * Báo khách chuyển đi
     * 
     * Cập nhật ngày rời khỏi phòng (left_at = now) giúp kết thúc các biến động chỉ số liên quan đến bạn cùng phòng.
     */
    public function destroy(string $contractId, string $memberId)
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            return response()->json(['message' => 'Contract Not Found'], 404);
        }

        $this->authorize('update', $contract); // Triggers via Contract ability

        $success = $this->service->removeMember($contractId, $memberId);
        if (! $success) {
            return response()->json(['message' => 'Member Not Found'], 404);
        }

        return response()->json(['message' => 'Member marked as left successfully']);
    }

    /**
     * Phê duyệt thành viên
     * 
     * Phê duyệt yêu cầu thêm người ở ghép từ Tenant.
     */
    public function approve(string $contractId, string $memberId)
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            return response()->json(['message' => 'Contract Not Found'], 404);
        }

        $this->authorize('update', $contract); // Only Staff/Manager/Owner can approve

        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            return response()->json(['message' => 'Member Not Found'], 404);
        }

        if ($member->status === 'APPROVED') {
            return response()->json(['message' => 'Member already approved'], 400);
        }

        $member->update([
            'status' => 'APPROVED',
            'joined_at' => now(),
        ]);

        return response()->json(['data' => $member]);
    }
}
