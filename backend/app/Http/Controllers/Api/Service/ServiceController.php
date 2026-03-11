<?php

namespace App\Http\Controllers\Api\Service;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\ServiceIndexRequest;
use App\Http\Requests\Service\ServiceStoreRequest;
use App\Http\Requests\Service\ServiceUpdateRequest;
use App\Http\Resources\Service\ServiceResource;
use App\Models\Service\Service;
use App\Services\Service\ServiceService; // Added
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Quản lý Dịch vụ (Services)
 *
 * API quản lý danh mục dịch vụ (Điện, Nước, Internet...) và đơn giá.
 * Hỗ trợ tạo mới kèm đơn giá ban đầu, cập nhật giá (lưu lịch sử) và quản lý thùng rác.
 */
#[Group('Dịch vụ')]
class ServiceController extends Controller
{
    public function __construct(protected ServiceService $service) {}

    /**
     * Danh sách dịch vụ
     *
     * Lấy danh sách dịch vụ của tổ chức hiện tại.
     */
    public function index(ServiceIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Service::class);

        $perPage = (int) $request->input('per_page', 15);
        $allowed = ['code', 'name', 'is_active', 'unit'];
        $search = $request->input('search');

        $paginator = $this->service->paginate($allowed, $perPage, $search);

        return ServiceResource::collection($paginator);
    }

    /**
     * Tạo dịch vụ mới
     *
     * Tạo dịch vụ kèm theo đơn giá ban đầu.
     */
    public function store(ServiceStoreRequest $request): ServiceResource
    {
        $this->authorize('create', Service::class);

        // Org ID is handled in Request validation context or inside Service logic via auth() if needed,
        // but ServiceService uses the data passed.
        // Request validation ensures uniqueness per org.
        // We need to ensure 'org_id' is passed to service create if not in validated data?
        // ServiceStoreRequest validation doesn't return 'org_id' if not in rules?
        // Actually, ServiceService::create relies on data.
        // Let's merge org_id from user here to be safe and explicit.

        $data = $request->validated();
        $data['org_id'] = $request->user()->org_id;

        $service = $this->service->create($data);

        return new ServiceResource($service);
    }

    /**
     * Chi tiết dịch vụ
     *
     * Xem thông tin chi tiết và lịch sử giá (nếu cần).
     */
    public function show($id): ServiceResource
    {
        $service = $this->service->find($id);
        if (! $service) {
            abort(404, 'Not Found');
        }

        $this->authorize('view', $service);

        // Load rates history for detail view
        $service->load('rates');

        return new ServiceResource($service);
    }

    /**
     * Cập nhật dịch vụ
     *
     * Cập nhật thông tin dịch vụ.
     * Nếu gửi kèm `price` khác giá hiện tại, sẽ tạo ra bản ghi giá mới.
     */
    public function update(ServiceUpdateRequest $request, string $id): ServiceResource
    {
        // Init model to check policy
        $serviceModel = $this->service->find($id);
        if (! $serviceModel) {
            abort(404, 'Not Found');
        }

        $this->authorize('update', $serviceModel);

        $service = $this->service->update($id, $request->validated());

        return new ServiceResource($service);
    }

    /**
     * Xóa dịch vụ (Soft Delete)
     *
     * Đưa dịch vụ vào thùng rác.
     */
    public function destroy(string $id): JsonResponse
    {
        $service = $this->service->find($id);
        if (! $service) {
            abort(404, 'Not Found');
        }

        $this->authorize('delete', $service);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Thùng rác dịch vụ
     *
     * Xem danh sách dịch vụ đã xóa tạm thời.
     */
    public function trash(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Service::class);

        $perPage = (int) $request->input('per_page', 15);
        $allowed = ['code', 'name', 'is_active', 'unit'];
        $search = $request->input('search');

        $paginator = $this->service->paginateTrash($allowed, $perPage, $search);

        return ServiceResource::collection($paginator);
    }

    /**
     * Khôi phục dịch vụ
     */
    public function restore(string $id): ServiceResource
    {
        $service = $this->service->findTrashed($id);
        if (! $service) {
            abort(404, 'Not Found');
        }

        $this->authorize('delete', $service);

        $this->service->restore($id);

        return new ServiceResource($service);
    }

    /**
     * Xóa vĩnh viễn dịch vụ
     */
    public function forceDelete(string $id): JsonResponse
    {
        $service = $this->service->findWithTrashed($id);
        if (! $service) {
            abort(404, 'Not Found');
        }

        $this->authorize('delete', $service);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully']);
    }
}
