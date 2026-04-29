<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractMemberIndexRequest;
use App\Http\Requests\Contract\ContractMemberStoreRequest;
use App\Http\Requests\Contract\ContractMemberUpdateRequest;
use App\Http\Resources\Contract\ContractMemberResource;
use App\Models\Contract\ContractMember;
use App\Services\Contract\ContractService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Arr;

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
     * Lấy toàn bộ thành viên đang và đã từng ở trong hợp đồng.
     */
    public function index(ContractMemberIndexRequest $request, string $contractId): AnonymousResourceCollection
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('view', $contract);

        return ContractMemberResource::collection(
            $contract->members()->with(['user', 'media'])->get()
        );
    }

    /**
     * Thêm khách mới
     *
     * Khai báo thêm thành viên vào một hợp đồng đang tồn tại mà không cần thiết lập tài khoản User trước.
     */
    public function store(ContractMemberStoreRequest $request, string $contractId): JsonResponse
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('addMember', $contract);

        $member = $this->service->addMember($contract, $request->validated(), $request->user());

        return ContractMemberResource::make($member->load(['user', 'media']))
            ->toResponse($request)
            ->setStatusCode(201);
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

        $member = ContractMember::where('contract_id', $contractId)
            ->with(['user', 'media'])
            ->find($memberId);
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

        $member = ContractMember::where('contract_id', $contractId)->find($memberId);
        if (! $member) {
            abort(404, 'Member Not Found');
        }

        $this->authorize('updateMember', [$contract, $member]);

        $validated = $request->validated();
        if ($request->user()->hasRole('Tenant')) {
            $validated = Arr::only($validated, [
                'full_name',
                'phone',
                'identity_number',
                'permanent_address',
                'date_of_birth',
                'license_plate',
                'identity_front_media_id',
                'identity_back_media_id',
            ]);
        }

        if ($validated === []) {
            abort(422, 'Không có dữ liệu hợp lệ để cập nhật.');
        }

        $updated = $this->service->updateMember($contractId, $memberId, $validated);

        if (! $updated) {
            abort(404, 'Member Not Found');
        }

        return new ContractMemberResource($updated->load(['user', 'media']));
    }

    /**
     * Báo khách chuyển đi
     *
     * Cập nhật ngày rời khỏi phòng (left_at = now) giúp kết thúc các biến động chỉ số liên quan đến bạn cùng phòng.
     */
    public function destroy(string $contractId, string $memberId): JsonResponse
    {
        $contract = $this->service->find($contractId);
        if (! $contract) {
            abort(404, 'Contract Not Found');
        }

        $this->authorize('removeMember', $contract);

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

        return new ContractMemberResource($member->load(['user', 'media']));
    }
}
