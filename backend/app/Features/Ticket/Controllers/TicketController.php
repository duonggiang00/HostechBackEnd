<?php

namespace App\Features\Ticket\Controllers;

use App\Features\Ticket\Models\Ticket;
use App\Features\Ticket\Requests\TicketIndexRequest;
use App\Features\Ticket\Requests\TicketStoreRequest;
use App\Http\Controllers\Controller;
use App\Features\Ticket\Requests\TicketCostStoreRequest;
use App\Features\Ticket\Requests\TicketEventStoreRequest;
use App\Features\Ticket\Requests\TicketStatusRequest;
use App\Features\Ticket\Requests\TicketUpdateRequest;
use App\Features\Ticket\Resources\TicketCostResource;
use App\Features\Ticket\Resources\TicketEventResource;
use App\Features\Ticket\Resources\TicketResource;
use App\Features\Ticket\Services\TicketService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Quản lý Phiếu Sự cố / Yêu cầu (Tickets)
 *
 * API cho phép tạo, theo dõi và xử lý các phiếu báo cáo sự cố, yêu cầu bảo trì từ cư dân hoặc nhân viên.
 *
 * **Luồng trạng thái ticket:**
 * `OPEN` → `RECEIVED` → `IN_PROGRESS` → `WAITING_PARTS` → `DONE` → `CANCELLED`
 *
 * **Phân quyền:**
 * - **Owner / Manager**: Toàn quyền CRUD, đổi trạng thái, thêm chi phí.
 * - **Staff**: Xem và đổi trạng thái, thêm ghi chú.
 * - **Tenant**: Tạo phiếu, xem phiếu của chính mình, thêm ghi chú.
 */
#[Group('Quản lý Phiếu Sự cố')]
class TicketController extends Controller
{
    public function __construct(protected TicketService $service) {}

    // ╔═══════════════════════════════════════════════════════╗
    // ║  LIST / READ ENDPOINTS                                ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Danh sách phiếu sự cố
     *
     * Lấy danh sách phiếu sự cố trong tổ chức. Hỗ trợ lọc, tìm kiếm và sắp xếp.
     *
     * - **Owner / Manager / Staff**: Thấy tất cả tickets trong org.
     * - **Tenant**: Chỉ thấy tickets do chính mình tạo.
     *
     * @responseField data array Danh sách phiếu sự cố.
     * @responseField data[].id string UUID phiếu sự cố.
     * @responseField data[].org_id string UUID tổ chức.
     * @responseField data[].property_id string UUID tòa nhà.
     * @responseField data[].room_id string UUID phòng.
     * @responseField data[].contract_id string|null UUID hợp đồng liên quan.
     * @responseField data[].created_by_user_id string UUID người tạo.
     * @responseField data[].assigned_to_user_id string|null UUID nhân viên được giao.
     * @responseField data[].category string|null Loại sự cố (Điện, Nước…).
     * @responseField data[].priority string Độ ưu tiên. Enum: LOW, MEDIUM, HIGH, URGENT.
     * @responseField data[].status string Trạng thái. Enum: OPEN, RECEIVED, IN_PROGRESS, WAITING_PARTS, DONE, CANCELLED.
     * @responseField data[].description string Mô tả chi tiết.
     * @responseField data[].property object Thông tin tòa nhà (eager loaded).
     * @responseField data[].room object Thông tin phòng (eager loaded).
     * @responseField data[].created_by object Người tạo phiếu.
     * @responseField data[].assigned_to object|null Nhân viên xử lý.
     * @responseField data[].due_at string|null Hạn xử lý (ISO 8601).
     * @responseField data[].closed_at string|null Thời điểm đóng phiếu (ISO 8601).
     * @responseField data[].created_at string Ngày tạo (ISO 8601).
     * @responseField data[].updated_at string Ngày cập nhật (ISO 8601).
     * @responseField meta object Thông tin pagination.
     * @responseField links object Các link pagination.
     */
    public function index(TicketIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Ticket::class);

        $perPage = min((int) $request->input('per_page', 15), 100);
        $perPage = $perPage < 1 ? 15 : $perPage;

        $paginator = $this->service->paginate(
            [],
            $perPage,
            $request->input('search')
        );

        return TicketResource::collection($paginator);
    }

    /**
     * Chi tiết phiếu sự cố
     *
     * Trả về đầy đủ thông tin ticket kèm lịch sử dòng thời gian (`events`) và danh sách chi phí (`costs`).
     *
     * - **Tenant**: Chỉ được xem ticket do chính mình tạo, nếu truy cập ticket người khác sẽ nhận `403`.
     *
     * @urlParam id string required UUID phiếu sự cố. Example: 9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a
     *
     * @responseField id string UUID phiếu sự cố.
     * @responseField org_id string UUID tổ chức.
     * @responseField property_id string UUID tòa nhà.
     * @responseField room_id string UUID phòng.
     * @responseField contract_id string|null UUID hợp đồng liên quan.
     * @responseField created_by_user_id string UUID người tạo.
     * @responseField assigned_to_user_id string|null UUID nhân viên xử lý.
     * @responseField category string|null Loại sự cố.
     * @responseField priority string Độ ưu tiên. Enum: LOW, MEDIUM, HIGH, URGENT.
     * @responseField status string Trạng thái. Enum: OPEN, RECEIVED, IN_PROGRESS, WAITING_PARTS, DONE, CANCELLED.
     * @responseField description string Mô tả chi tiết.
     * @responseField property object Thông tin tòa nhà.
     * @responseField room object Thông tin phòng.
     * @responseField created_by object Người tạo.
     * @responseField assigned_to object|null Nhân viên xử lý.
     * @responseField events array Lịch sử dòng thời gian (CREATED, STATUS_CHANGED, COMMENT).
     * @responseField events[].id string UUID.
     * @responseField events[].type string Loại event. Enum: CREATED, STATUS_CHANGED, COMMENT.
     * @responseField events[].message string|null Nội dung.
     * @responseField events[].meta object|null Dữ liệu bổ sung (vd: new_status).
     * @responseField events[].actor object Người thực hiện.
     * @responseField events[].created_at string Thời điểm (ISO 8601).
     * @responseField costs array Danh sách chi phí phát sinh.
     * @responseField costs[].id string UUID.
     * @responseField costs[].amount number Số tiền (VND).
     * @responseField costs[].payer string Bên chịu chi phí. Enum: OWNER, TENANT.
     * @responseField costs[].note string|null Ghi chú.
     * @responseField costs[].created_by object Người ghi nhận chi phí.
     * @responseField costs[].created_at string ISO 8601.
     * @responseField due_at string|null Hạn xử lý (ISO 8601).
     * @responseField closed_at string|null Thời điểm đóng phiếu (ISO 8601).
     * @responseField created_at string Ngày tạo (ISO 8601).
     * @responseField updated_at string Ngày cập nhật (ISO 8601).
     *
     * @response 404 {"message": "Không tìm thấy phiếu sự cố."}
     * @response 403 {"message": "This action is unauthorized."}
     */
    public function show(string $id): TicketResource
    {
        $ticket = $this->service->find($id);

        if (! $ticket) {
            abort(404, 'Không tìm thấy phiếu sự cố.');
        }

        $this->authorize('view', $ticket);

        return new TicketResource($ticket);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  CREATE / UPDATE / DELETE ENDPOINTS                   ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Tạo phiếu sự cố mới
     *
     * Tạo mới phiếu báo cáo sự cố hoặc yêu cầu bảo trì.
     *
     * **Lưu ý tự động:**
     * - `org_id` lấy từ tài khoản đang đăng nhập.
     * - `created_by_user_id` gán tự động.
     * - `contract_id` tự động tìm hợp đồng ACTIVE của phòng nếu không truyền.
     * - `status` mặc định là `OPEN`.
     * - Tự động ghi 1 `TicketEvent` loại `CREATED` vào timeline.
     *
     * @response 201 scenario="Tạo thành công" {}
     * @response 422 scenario="Validation thất bại" {"message": "The property_id field is required.", "errors": {}}
     * @response 403 scenario="Không có quyền" {"message": "This action is unauthorized."}
     */
    public function store(TicketStoreRequest $request): JsonResponse
    {
        $this->authorize('create', Ticket::class);

        $ticket = $this->service->create($request->validated());

        $ticket->load(['property', 'room', 'createdBy', 'assignedTo']);

        return (new TicketResource($ticket))->response()->setStatusCode(201);
    }

    /**
     * Cập nhật thông tin ticket
     *
     * Cập nhật mức độ ưu tiên, loại sự cố, người xử lý, hạn chót xử lý.
     * Dành cho **Owner / Manager**. Staff và Tenant không có quyền.
     *
     * @urlParam id string required UUID phiếu sự cố. Example: 9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a
     *
     * @response 200 scenario="Cập nhật thành công" {}
     * @response 403 scenario="Không có quyền" {"message": "This action is unauthorized."}
     * @response 404 scenario="Không tìm thấy" {"message": "No query results for model [App\Features\Ticket\Models\Ticket]."}
     * @response 422 scenario="Validation thất bại" {"message": "The assigned_to_user_id field must be a valid UUID.", "errors": {}}
     */
    public function update(TicketUpdateRequest $request, string $id): TicketResource
    {
        $ticket = Ticket::findOrFail($id);
        $this->authorize('update', $ticket);

        $ticket = $this->service->update($ticket, $request->validated());

        return new TicketResource($ticket);
    }

    /**
     * Xóa phiếu sự cố
     *
     * Xóa mềm (Soft Delete) phiếu sự cố khỏi hệ thống. Chỉ **Owner / Manager** mới được xóa.
     *
     * @urlParam id string required UUID phiếu sự cố. Example: 9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a
     *
     * @response 200 {"message": "Đã xóa phiếu sự cố."}
     * @response 403 scenario="Không có quyền" {"message": "This action is unauthorized."}
     * @response 404 scenario="Không tìm thấy" {"message": "No query results for model [App\Features\Ticket\Models\Ticket]."}
     */
    public function destroy(string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $this->authorize('delete', $ticket);

        $this->service->delete($ticket);

        return response()->json(['message' => 'Đã xóa phiếu sự cố.'], 200);
    }

    // ╔═══════════════════════════════════════════════════════╗
    // ║  STATUS / EVENTS / COSTS ENDPOINTS                   ║
    // ╠═══════════════════════════════════════════════════════╣

    /**
     * Chuyển trạng thái ticket
     *
     * Đổi trạng thái vòng đời của ticket. Dành cho **Owner / Manager / Staff**.
     *
     * **Luồng trạng thái hợp lệ:**
     * ```
     * OPEN → RECEIVED → IN_PROGRESS → WAITING_PARTS → DONE
     *                                               ↘ CANCELLED
     * ```
     *
     * **Tự động:**
     * - Ghi 1 `TicketEvent` loại `STATUS_CHANGED` kèm `meta.new_status`.
     * - Khi chuyển sang `DONE` hoặc `CANCELLED`: điền `closed_at = now()`.
     * - Khi reopen từ `DONE`/`CANCELLED`: xóa `closed_at`.
     *
     * @urlParam id string required UUID phiếu sự cố. Example: 9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a
     *
     * @response 200 scenario="Đổi trạng thái thành công" {}
     * @response 403 scenario="Không có quyền" {"message": "This action is unauthorized."}
     * @response 404 scenario="Không tìm thấy" {"message": "No query results for model [App\Features\Ticket\Models\Ticket]."}
     * @response 422 scenario="Trạng thái không hợp lệ" {"message": "The status field must be one of OPEN, RECEIVED, IN_PROGRESS, WAITING_PARTS, DONE, CANCELLED.", "errors": {}}
     */
    public function updateStatus(TicketStatusRequest $request, string $id): TicketResource
    {
        $ticket = Ticket::findOrFail($id);
        $this->authorize('updateStatus', $ticket);

        $ticket = $this->service->updateStatus(
            $ticket,
            $request->validated(),
            $request->user()->id
        );

        return new TicketResource($ticket);
    }

    /**
     * Thêm bình luận / trao đổi vào ticket
     *
     * Ghi thêm 1 dòng comment (`TicketEvent` loại `COMMENT`) vào timeline của ticket.
     *
     * **Phân quyền:**
     * - **Owner / Manager / Staff**: Comment được trên tất cả ticket trong org.
     * - **Tenant**: Chỉ comment được trên ticket do chính mình tạo.
     *
     * @urlParam id string required UUID phiếu sự cố. Example: 9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a
     *
     * @responseField id string UUID event.
     * @responseField type string Luôn là `COMMENT`.
     * @responseField message string Nội dung bình luận.
     * @responseField meta null Không có dữ liệu meta cho COMMENT.
     * @responseField actor object Thông tin người bình luận.
     * @responseField created_at string Thời điểm gửi (ISO 8601).
     *
     * @response 201 scenario="Ghi chú thành công" {}
     * @response 403 scenario="Không có quyền" {"message": "This action is unauthorized."}
     * @response 404 scenario="Không tìm thấy ticket" {"message": "No query results for model [App\Features\Ticket\Models\Ticket]."}
     * @response 422 scenario="Validation thất bại" {"message": "The message field is required.", "errors": {}}
     */
    public function storeEvent(TicketEventStoreRequest $request, string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $this->authorize('addEvent', $ticket);

        $event = $this->service->addEvent($ticket, $request->validated(), $request->user()->id);
        $event->load('actor');

        return (new TicketEventResource($event))->response()->setStatusCode(201);
    }

    /**
     * Thêm chi phí sửa chữa vào ticket
     *
     * Chốt chi phí phát sinh khi xử lý sự cố. Dành cho **Owner / Manager**.
     *
     * **Điều kiện:** Ticket phải đang ở trạng thái `IN_PROGRESS`, `WAITING_PARTS` hoặc `DONE`.
     * Nếu ticket đang `OPEN`, `RECEIVED` hoặc `CANCELLED` sẽ trả về `422`.
     *
     * @urlParam id string required UUID phiếu sự cố. Example: 9d8e7f6a-5b4c-3d2e-1f0a-9b8c7d6e5f4a
     *
     * @responseField id string UUID chi phí.
     * @responseField amount number Số tiền (VND).
     * @responseField payer string Bên chịu chi phí. Enum: OWNER, TENANT.
     * @responseField note string|null Ghi chú chi tiết.
     * @responseField created_by object Nhân viên ghi nhận chi phí.
     * @responseField created_at string Thời điểm ghi nhận (ISO 8601).
     *
     * @response 201 scenario="Tạo chi phí thành công" {}
     * @response 422 scenario="Trạng thái không hợp lệ" {"message": "Chỉ được thêm chi phí khi ticket đang IN_PROGRESS, WAITING_PARTS hoặc DONE."}
     * @response 403 scenario="Không có quyền" {"message": "This action is unauthorized."}
     * @response 404 scenario="Không tìm thấy ticket" {"message": "No query results for model [App\Features\Ticket\Models\Ticket]."}
     */
    public function storeCost(TicketCostStoreRequest $request, string $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $this->authorize('addCost', $ticket);

        try {
            $cost = $this->service->addCost($ticket, $request->validated(), $request->user()->id);
        } catch (\InvalidArgumentException $e) {
            abort(422, $e->getMessage());
        }

        $cost->load('createdBy');

        return (new TicketCostResource($cost))->response()->setStatusCode(201);
    }
}
