<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractMemberStoreRequest;
use App\Http\Requests\Contract\ContractMemberUpdateRequest;
use App\Http\Resources\Contract\ContractMemberResource;
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
    public function index(Request $request, string $contractId): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('view', $contract);

        return ContractMemberResource::collection($contract->members);
    }

    /**
     * Thêm khách mới
     *
     * Khai báo thêm thành viên vào một hợp đồng đang tồn tại mà không cần thiết lập tài khoản User trước.
     */
    public function store(ContractMemberStoreRequest $request, string $contractId): ContractMemberResource
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('addMember', [Contract::class, $contract]);

        $member = $this->service->addMember($contract, $request->validated(), $request->user());

        return new ContractMemberResource($member);
    }

    /**
     * Xem chi tiết một khách
     */
    public function show(string $contractId, string $memberId): ContractMemberResource
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('view', $contract);

        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            abort(404, 'Member Not Found');
        }

        return new ContractMemberResource($member);
    }

    /**
     * Cập nhật khách
     *
     * Cập nhật thông tin CCCD, sđt hoặc vai trò (Role) của người dùng trong khoảng thời gian hợp đồng.
     */
    public function update(ContractMemberUpdateRequest $request, string $contractId, string $memberId): ContractMemberResource
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('update', $contract);

        $updated = $this->service->updateMember($contractId, $memberId, $request->validated());

        if (! $updated) {
            abort(404, 'Member Not Found');
        }

        return new ContractMemberResource($updated);
    }

    /**
     * Báo khách chuyển đi
     *
     * Cập nhật ngày rời khỏi phòng (left_at = now) giúp kết thúc các biến động chỉ số liên quan đến bạn cùng phòng.
     */
    public function destroy(string $contractId, string $memberId): \Illuminate\Http\JsonResponse
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('update', $contract);

        $success = $this->service->removeMember($contractId, $memberId);
        if (! $success) {
            abort(404, 'Member Not Found');
        }

        return response()->json(['message' => 'Member marked as left successfully']);
    }

    /**
     * Phê duyệt thành viên
     *
     * Phê duyệt yêu cầu thêm người ở ghép từ Tenant.
     */
    public function approve(string $contractId, string $memberId): ContractMemberResource
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('update', $contract);

        $member = $this->service->approveMember($contractId, $memberId);
        if (! $member) {
            abort(400, 'Member Not Found or already approved');
        }

        return new ContractMemberResource($member);
    }
}
