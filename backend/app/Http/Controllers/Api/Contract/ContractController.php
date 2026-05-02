<?php

namespace App\Http\Controllers\Api\Contract;

use App\Http\Controllers\Controller;
use App\Http\Requests\Contract\ContractIndexRequest;
use App\Http\Requests\Contract\ContractRequestTerminationRequest;
use App\Http\Requests\Contract\ContractStoreRequest;
use App\Http\Requests\Contract\ContractUpdateRequest;
use App\Http\Requests\Contract\ExecuteRoomTransferRequest;
use App\Http\Requests\Contract\RoomTransferRequest;
use App\Http\Resources\Contract\ContractResource;
use App\Http\Resources\Contract\ContractStatusHistoryResource;
use App\Http\Resources\Handover\HandoverItemResource;
use App\Jobs\Contract\ProcessContractTerminationJob;
use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use App\Models\Org\User;
use App\Models\Property\Room;
use App\Services\Contract\ContractService;
use App\Services\Contract\Termination\TerminationReconciliationService;
use App\Services\Handover\HandoverService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Throwable;

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
     * Lấy danh sách hợp đồng. Hỗ trợ lọc theo Property, Room, Status.
     */
    public function index(ContractIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Contract::class);

        $paginator = $this->service->paginate(
            allowedFilters: ['property_id', 'room_id', 'status'],
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
            user: $request->user()
        );

        $statusCounts = $this->service->getStatusCounts(
            user: $request->user(),
            propertyId: $request->input('filter.property_id'),
        );

        return ContractResource::collection($paginator)->additional([
            'status_counts' => $statusCounts,
        ]);
    }

    /**
     * Danh sách hợp đồng đã xóa (Thùng rác)
     */
    public function trash(ContractIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Contract::class);

        $paginator = $this->service->paginateTrash(
            allowedFilters: ['property_id', 'room_id', 'status'],
            perPage: (int) $request->input('per_page', 15),
            search: $request->input('search'),
            user: $request->user()
        );

        return ContractResource::collection($paginator);
    }

    /**
     * Tạo hợp đồng mới
     */
    public function store(ContractStoreRequest $request): ContractResource
    {
        $this->authorize('create', Contract::class);

        $contract = $this->service->create($request->validated(), $request->user());

        return new ContractResource($contract);
    }

    /**
     * Chi tiết hợp đồng
     */
    public function show(string $id): ContractResource|JsonResponse
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $contract);

        return new ContractResource($contract);
    }

    /**
     * Cập nhật hợp đồng
     */
    public function update(ContractUpdateRequest $request, string $id): ContractResource|JsonResponse
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('update', $contract);

        $updated = $this->service->update($id, $request->validated());

        return new ContractResource($updated);
    }

    /**
     * Xóa hợp đồng (Soft Delete)
     */
    public function destroy(string $id): JsonResponse
    {
        $contract = $this->service->find($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('delete', $contract);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully'], 200);
    }

    /**
     * Khôi phục hợp đồng
     */
    public function restore(string $id): ContractResource|JsonResponse
    {
        $contract = $this->service->findTrashed($id);
        if (! $contract) {
            abort(404, 'Not Found');
        }

        $this->authorize('restore', $contract);

        $this->service->restore($id);

        return new ContractResource($contract);
    }

    /**
     * Xóa vĩnh viễn hợp đồng
     */
    public function forceDelete(string $id): JsonResponse
    {
        $contract = $this->service->findWithTrashed($id);
        if (! $contract) {
            abort(404, 'Not Found');
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
    public function myPendingContracts(Request $request): AnonymousResourceCollection
    {
        $contracts = $this->service->myPendingContracts($request->user());

        return ContractResource::collection($contracts);
    }

    /**
     * Danh sách hợp đồng của tôi (Tất cả - Dành cho Tenant)
     *
     * Liệt kê các hợp đồng mà user hiện tại đang được gán không phân biệt pending, active hay expired.
     */
    public function myContracts(Request $request): AnonymousResourceCollection
    {
        $contracts = $this->service->myContracts($request->user());

        return ContractResource::collection($contracts);
    }

    /**
     * Xác nhận ký hợp đồng
     *
     * Tenant đồng ý và tiến hành tham gia hợp đồng.
     * Chỉ hoạt động khi user hiện tại là thành viên PENDING của hợp đồng này.
     */
    public function acceptSignature(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $success = $this->service->acceptSignature($contract, $request->user());

        if (! $success) {
            abort(403, 'Bạn không có quyền hoặc hợp đồng này không ở trạng thái chờ ký.');
        }

        return response()->json(['message' => 'Đã xác nhận hợp đồng thành công.']);
    }

    /**
     * Ký hợp đồng bằng chữ ký điện tử
     */
    public function sign(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);
        $this->authorize('view', $contract);

        $validated = $request->validate([
            'signature_image' => 'required|string',
        ]);

        $this->service->signContract($contract, $validated['signature_image']);

        return response()->json(['message' => 'Đã ký hợp đồng thành công.']);
    }

    /**
     * Từ chối hợp đồng
     *
     * Tenant từ chối tham gia hợp đồng.
     * Chỉ hoạt động khi user hiện tại là thành viên PENDING của hợp đồng này.
     */
    public function rejectSignature(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $success = $this->service->rejectSignature($contract, $request->user());

        if (! $success) {
            abort(403, 'Bạn không có quyền thao tác trên hợp đồng này.');
        }

        return response()->json(['message' => 'Đã từ chối hợp đồng.']);
    }

    // ───────────────────────────────────────────────────────────────────────────
    //  TENANT SELF-SERVICE
    // ───────────────────────────────────────────────────────────────────────────

    /**
     * Danh sách phòng trống cùng Tòa nhà (để xem trước khi xin đổi phòng)
     *
     * Tenant có hợp đồng ACTIVE tại Tòa nhà có thể xem danh sách phòng trống (AVAILABLE)
     * trong cùng Property, phục vụ mục đích xin đổi phòng.
     */
    public function availableRooms(Request $request, string $id): JsonResponse
    {
        $contract = Contract::with('property')->findOrFail($id);

        $this->authorize('view', $contract);

        $rooms = $this->service->getAvailableRoomsForTransfer($contract);

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
     * Quản lý sẽ xem xét và phê duyệt hoặc từ chối yêu cầu.
     */
    public function roomTransferRequest(RoomTransferRequest $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('view', $contract);

        $success = $this->service->requestRoomTransfer($contract, $request->user(), $request->validated());

        if (! $success) {
            abort(422, 'Phòng đích không hợp lệ hoặc không còn trống.');
        }

        return response()->json([
            'message' => 'Đã gửi yêu cầu đổi phòng thành công. Quản lý sẽ xem xét trong thời gian sớm nhất.',
            'target_room' => [
                'id' => $request->validated()['target_room_id'],
            ],
        ]);
    }

    /**
     * Xác nhận thanh toán & Kích hoạt hợp đồng (Admin)
     *
     * Luồng: Contract (PENDING_PAYMENT) -> Confirm -> ACTIVE.
     * Đồng thời đổi trạng thái Room -> occupied.
     */
    public function confirmPayment(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('update', $contract);

        $this->service->confirmPayment($contract, $request->user());

        return response()->json(['message' => 'Đã xác nhận thanh toán và kích hoạt hợp đồng thành công.']);
    }

    /**
     * Thanh lý hợp đồng / Kết thúc sớm (Admin)
     *
     * Quy tắc xử lý tiền cọc:
     * - Tenant hủy trước hạn + waive_penalty=false → Phạt toàn bộ cọc (FORFEITED, status CANCELLED)
     * - Tenant hủy trước hạn + waive_penalty=true → Hoàn cọc (REFUND_PENDING, status TERMINATED)
     * - Chủ nhà hủy hoặc kết thúc đúng hạn → Hoàn cọc (REFUND_PENDING)
     */
    /**
     * Xem trạng thái biên bản thanh lý: bản đã lưu (nếu có) hoặc xem trước từ tài sản phòng — không tạo bản ghi handover mới.
     */
    public function terminationHandover(Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);

        $state = app(HandoverService::class)->getTerminationHandoverState($contract);

        $itemsData = $state['persisted']
            ? HandoverItemResource::collection($state['handover']->items)->resolve()
            : $state['items'];

        $handoverPayload = $state['persisted'] && $state['handover']
            ? [
                'id' => $state['handover']->id,
                'org_id' => $state['handover']->org_id,
                'contract_id' => $state['handover']->contract_id,
                'room_id' => $state['handover']->room_id,
                'note' => $state['handover']->note,
                'document_scan_urls' => $state['handover']->getMedia('document_scans')->map->getUrl()->values()->all(),
                'created_at' => $state['handover']->created_at,
                'updated_at' => $state['handover']->updated_at,
            ]
            : null;

        return response()->json([
            'message' => $state['persisted']
                ? 'Đã tải biên bản bàn giao.'
                : 'Xem trước danh mục phòng (chưa tạo biên bản trên hệ thống).',
            'data' => [
                'persisted' => $state['persisted'],
                'handover' => $handoverPayload,
                'default_handover_note' => $state['persisted']
                    ? null
                    : HandoverService::DEFAULT_TERMINATION_HANDOVER_NOTE,
                'items' => $itemsData,
            ],
        ]);
    }

    /**
     * Lưu biên bản nháp lên DB (sau khi hoàn tất bước đánh giá phòng trong wizard).
     */
    public function commitTerminationHandover(Request $request, Contract $contract): JsonResponse
    {
        $this->authorize('update', $contract);

        $validated = $request->validate([
            'items' => ['nullable', 'array'],
            'items.*.room_asset_id' => ['required', 'uuid'],
            'items.*.condition' => ['nullable', 'string', 'in:OK,MISSING,DAMAGED'],
            'note' => ['sometimes', 'nullable', 'string', 'max:10000'],
        ]);

        $handoverNoteProvided = array_key_exists('note', $validated);

        $handover = app(HandoverService::class)->commitTerminationHandover(
            $contract,
            $validated['items'] ?? [],
            $handoverNoteProvided,
            $handoverNoteProvided ? ($validated['note'] ?? null) : null,
        );

        return response()->json([
            'message' => 'Đã lưu biên bản bàn giao.',
            'data' => [
                'persisted' => true,
                'handover' => [
                    'id' => $handover->id,
                    'org_id' => $handover->org_id,
                    'contract_id' => $handover->contract_id,
                    'room_id' => $handover->room_id,
                    'note' => $handover->note,
                    'document_scan_urls' => $handover->getMedia('document_scans')->map->getUrl()->values()->all(),
                    'created_at' => $handover->created_at,
                    'updated_at' => $handover->updated_at,
                ],
                'items' => HandoverItemResource::collection($handover->items)->resolve(),
            ],
        ]);
    }

    /**
     * Xem trước quyết toán cọc / nợ (ledger) trước khi xác nhận thanh lý.
     */
    public function liquidationPreview(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('view', $contract);

        $validated = $request->validate([
            'termination_date' => 'nullable|date',
            'damage_fee_total' => 'nullable|numeric|min:0',
            'waive_penalty' => 'nullable|boolean',
            'cancellation_party' => 'nullable|string|in:LANDLORD,TENANT,MUTUAL,SYSTEM',
        ], [
            'termination_date.date' => 'Ngày thanh lý không hợp lệ.',
            'damage_fee_total.numeric' => 'Phí hư hỏng phải là số.',
            'damage_fee_total.min' => 'Phí hư hỏng không được âm.',
            'cancellation_party.in' => 'Giá trị bên khởi xướng không hợp lệ.',
        ]);

        $terminationDate = $validated['termination_date'] ?? now()->toDateString();

        $preview = app(TerminationReconciliationService::class)->preview(
            $contract,
            $terminationDate,
            $validated
        );

        return response()->json([
            'message' => 'Đã tính xem trước quyết toán.',
            'data' => $preview,
        ]);
    }

    public function terminate(Request $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('update', $contract);

        $validated = $request->validate([
            'termination_date' => 'nullable|date',
            'cancellation_party' => 'nullable|string|in:LANDLORD,TENANT,MUTUAL,SYSTEM',
            'cancellation_reason' => 'nullable|string|max:1000',
            'waive_penalty' => 'nullable|boolean',
            'refund_remaining_rent' => 'nullable|boolean',
            'forfeit_deposit' => 'nullable|boolean',
            'damage_fee_total' => 'nullable|numeric|min:0',
        ], [
            'termination_date.date' => 'Ngày thanh lý không hợp lệ.',
            'cancellation_party.in' => 'Giá trị bên khởi xướng không hợp lệ.',
            'damage_fee_total.numeric' => 'Phí hư hỏng phải là số.',
            'damage_fee_total.min' => 'Phí hư hỏng không được âm.',
        ]);

        $lockName = ProcessContractTerminationJob::terminationLockName($contract->id);
        $lock = Cache::lock($lockName, 120);

        if (! $lock->get()) {
            return response()->json([
                'message' => 'Hợp đồng đang được thanh lý hoặc đã có yêu cầu xử lý. Vui lòng đợi vài phút hoặc làm mới trang.',
            ], 409);
        }

        try {
            ProcessContractTerminationJob::dispatch(
                $contract->id,
                $validated,
                (string) $request->user()->id,
                $lock->owner(),
            )->afterCommit();
        } catch (Throwable $e) {
            $lock->release();

            throw $e;
        }

        return response()->json([
            'message' => 'Đã tiếp nhận yêu cầu thanh lý. Hệ thống đang xử lý; kết quả sẽ được đẩy qua WebSocket (các bước pipeline và kết thúc).',
            'status' => 'processing',
            'contract_id' => $contract->id,
            'property_id' => $contract->property_id,
            'processing_mode' => 'async_eda',
        ], 202);
    }

    /**
     * Tenant gửi thông báo trả phòng (ngày dự kiến dọn đi + lý do).
     *
     * Chuyển hợp đồng sang trạng thái PENDING_TERMINATION.
     * Manager sẽ nhìn thấy yêu cầu này và quyết định xử lý cọc.
     */
    public function requestTermination(ContractRequestTerminationRequest $request, Contract $contract): JsonResponse
    {
        $this->authorize('view', $contract);

        $result = $this->service->requestTermination($contract, $request->user(), $request->validated());

        /** @var Contract $updated */
        $updated = $result['contract'];
        $status = $updated->status instanceof \BackedEnum ? $updated->status->value : (string) $updated->status;

        return response()->json([
            'message' => 'Đã gửi thông báo trả phòng. Quản lý sẽ liên hệ khi cần.',
            'warnings' => $result['warnings'],
            'is_early_termination' => $result['is_early_termination'],
            'contract' => [
                'id' => $updated->id,
                'status' => $status,
                'expected_move_out_date' => $updated->expected_move_out_date?->toDateString(),
                'end_date' => $updated->end_date?->toDateString(),
            ],
        ]);
    }

    /**
     * Lịch sử trạng thái của hợp đồng (Timeline)
     *
     * Trả về toàn bộ lịch sử chuyển trạng thái theo thời gian.
     */
    public function statusHistories(string $id): AnonymousResourceCollection
    {
        $contract = Contract::with([
            'statusHistories.changedBy:id,full_name,email',
        ])->findOrFail($id);

        $this->authorize('view', $contract);

        return ContractStatusHistoryResource::collection($contract->statusHistories);
    }

    /**
     * Thực hiện chuyển phòng cho khách hàng
     *
     * Chấm dứt hợp đồng cũ, tạo hợp đồng mới và thực hiện điều chuyển cọc, tiền nhà thừa.
     */
    public function executeTransfer(ExecuteRoomTransferRequest $request, string $id): JsonResponse
    {
        $contract = Contract::findOrFail($id);

        $this->authorize('update', $contract);

        $this->service->executeTransfer($contract, $request->validated(), $request->user());

        return response()->json([
            'message' => 'Đã thực hiện chuyển phòng thành công.',
        ]);
    }

    /**
     * Danh sách yêu cầu đang chờ duyệt theo Property (Aggregated)
     *
     * Tổng hợp 3 nguồn:
     * 1. Transfer Requests trong contracts.meta->transfer_requests (status=PENDING)
     * 2. ContractMembers với status=PENDING thuộc property
     * 3. Contracts với status=PENDING_TERMINATION thuộc property
     */
    public function pendingRequests(Request $request, string $propertyId): JsonResponse
    {
        $this->authorize('viewAny', Contract::class);

        $results = [];

        // ── 1. ROOM TRANSFER REQUESTS (từ meta JSON) ──────────────────────────
        $contractsWithTransfer = Contract::with(['room:id,name,code', 'members' => fn ($q) => $q->where('is_primary', true)->with('user:id,full_name')])
            ->where('property_id', $propertyId)
            ->whereNotNull('meta')
            ->whereIn('status', ['ACTIVE', 'PENDING_TRANSFER'])
            ->get();

        foreach ($contractsWithTransfer as $contract) {
            $transferRequests = $contract->meta['transfer_requests'] ?? [];
            foreach ($transferRequests as $index => $req) {
                if (($req['status'] ?? '') !== 'PENDING') {
                    continue;
                }
                $primaryMember = $contract->members->first();
                $requestedById = $req['requested_by'] ?? null;
                $requesterName = is_string($requestedById)
                    ? (User::query()->whereKey($requestedById)->value('full_name'))
                    : null;
                $results[] = [
                    'type' => 'ROOM_TRANSFER',
                    'contract_id' => $contract->id,
                    'room_name' => $contract->room?->name ?? $contract->room?->code ?? 'N/A',
                    'tenant_full_name' => $primaryMember?->user?->full_name ?? $primaryMember?->full_name ?? 'N/A',
                    'requester_full_name' => $requesterName ?? $primaryMember?->user?->full_name ?? $primaryMember?->full_name ?? 'N/A',
                    'from_room' => $contract->room?->name ?? $contract->room?->code,
                    'from_room_id' => $contract->room_id,
                    'to_room_id' => $req['to_room_id'] ?? null,
                    'to_room' => $req['to_room_id'] ?? null, // Will be resolved on FE or enriched below
                    'reason' => $req['reason'] ?? null,
                    'requested_at' => $req['requested_at'] ?? $contract->updated_at,
                    'request_index' => $index,
                ];
            }
        }

        // Enrich to_room names using Room model
        $toRoomIds = collect($results)
            ->where('type', 'ROOM_TRANSFER')
            ->pluck('to_room_id')
            ->filter()
            ->unique()
            ->values();

        if ($toRoomIds->isNotEmpty()) {
            $toRooms = Room::whereIn('id', $toRoomIds)
                ->select('id', 'name', 'code')
                ->get()
                ->keyBy('id');

            foreach ($results as &$item) {
                if ($item['type'] === 'ROOM_TRANSFER' && isset($item['to_room_id'])) {
                    $room = $toRooms->get($item['to_room_id']);
                    $item['to_room'] = $room?->name ?? $room?->code ?? $item['to_room_id'];
                }
            }
            unset($item);
        }

        // ── 2. ADD MEMBER REQUESTS (ContractMember status=PENDING) ────────────
        $pendingMembers = ContractMember::with(['contract.room:id,name,code'])
            ->whereHas('contract', fn ($q) => $q->where('property_id', $propertyId))
            ->where('status', 'PENDING')
            ->whereNull('is_primary') // Exclude primary tenant placeholder
            ->orWhere(function ($q) use ($propertyId) {
                $q->whereHas('contract', fn ($q2) => $q2->where('property_id', $propertyId))
                    ->where('status', 'PENDING')
                    ->where('is_primary', false);
            })
            ->get();

        // Deduplicate — chỉ lấy is_primary = false và status = PENDING
        $cleanPendingMembers = ContractMember::with(['contract.room:id,name,code'])
            ->whereHas('contract', fn ($q) => $q->where('property_id', $propertyId)->whereIn('status', ['ACTIVE', 'PENDING_SIGNATURE']))
            ->where('status', 'PENDING')
            ->where('is_primary', false)
            ->get();

        foreach ($cleanPendingMembers as $member) {
            $contractModel = $member->contract;
            $primary = $contractModel
                ? $contractModel->members()->where('is_primary', true)->with('user:id,full_name')->first()
                : null;
            $results[] = [
                'type' => 'ADD_MEMBER',
                'contract_id' => $member->contract_id,
                'member_id' => $member->id,
                'room_name' => $member->contract?->room?->name ?? $member->contract?->room?->code ?? 'N/A',
                'requester_full_name' => $primary?->user?->full_name ?? $primary?->full_name ?? 'Cư dân',
                'member_full_name' => $member->full_name,
                'member_phone' => $member->phone,
                'member_role' => $member->role,
                'requested_at' => $member->created_at,
            ];
        }

        // ── 3. TERMINATION REQUESTS (status=PENDING_TERMINATION) ──────────────
        $terminationContracts = Contract::with(['room:id,name,code', 'members' => fn ($q) => $q->where('is_primary', true)->with('user:id,full_name')])
            ->where('property_id', $propertyId)
            ->where('status', 'PENDING_TERMINATION')
            ->get();

        foreach ($terminationContracts as $contract) {
            $primaryMember = $contract->members->first();
            $results[] = [
                'type' => 'TERMINATION',
                'contract_id' => $contract->id,
                'room_name' => $contract->room?->name ?? $contract->room?->code ?? 'N/A',
                'tenant_full_name' => $primaryMember?->user?->full_name ?? $primaryMember?->full_name ?? 'N/A',
                'reason' => $contract->cancellation_reason,
                'requested_at' => $contract->notice_given_at ?? $contract->updated_at,
            ];
        }

        // Sort all by requested_at descending
        usort($results, fn ($a, $b) => strcmp((string) ($b['requested_at'] ?? ''), (string) ($a['requested_at'] ?? '')));

        return response()->json([
            'data' => $results,
            'meta' => [
                'total' => count($results),
                'transfer_count' => count(array_filter($results, fn ($r) => $r['type'] === 'ROOM_TRANSFER')),
                'add_member_count' => count(array_filter($results, fn ($r) => $r['type'] === 'ADD_MEMBER')),
                'termination_count' => count(array_filter($results, fn ($r) => $r['type'] === 'TERMINATION')),
            ],
        ]);
    }
}
