<?php

namespace App\Http\Controllers\Api\Service;

use App\Http\Controllers\Controller;
use App\Http\Requests\Service\ServiceStoreRequest;
use App\Http\Requests\Service\ServiceUpdateRequest;
use App\Http\Resources\Service\ServiceResource;
use App\Models\Service\Service;
use App\Services\Service\ServiceService;
use App\Http\Requests\Service\ServiceIndexRequest; // Added
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

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
     * 
     * @queryParam per_page int Số lượng mục mỗi trang. Default: 15. Example: 10
     * @queryParam page int Số trang. Example: 1
     * @queryParam search string Tìm kiếm theo tên hoặc mã dịch vụ. Example: Electric
     * @queryParam filter[is_active] boolean Lọc theo trạng thái hoạt động (1: Active, 0: Inactive). Example: 1
     * @queryParam filter[unit] string Lọc theo đơn vị tính. Example: kwh
     * @queryParam sort string Sắp xếp theo trường (prefix '-' để giảm dần). Các trường hỗ trợ: code, name, created_at. Default: code. Example: -created_at
     */
    public function index(ServiceIndexRequest $request)
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
    public function store(ServiceStoreRequest $request)
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
    public function show($id)
    {
        $service = $this->service->find($id);
        if (! $service) return response()->json(['message' => 'Not Found'], 404);

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
    public function update(ServiceUpdateRequest $request, string $id)
    {
        // Init model to check policy
        $serviceModel = $this->service->find($id);
        if (! $serviceModel) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('update', $serviceModel);

        $service = $this->service->update($id, $request->validated());

        return new ServiceResource($service);
    }

    /**
     * Xóa dịch vụ (Soft Delete)
     * 
     * Đưa dịch vụ vào thùng rác.
     */
    public function destroy(string $id)
    {
        $service = $this->service->find($id);
        if (! $service) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $service);

        $this->service->delete($id);

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Thùng rác dịch vụ
     * 
     * Xem danh sách dịch vụ đã xóa tạm thời.
     * 
     * @queryParam per_page int Số lượng mục mỗi trang. Default: 15. Example: 10
     * @queryParam page int Số trang. Example: 1
     * @queryParam search string Tìm kiếm theo tên hoặc mã dịch vụ. Example: Electric
     * @queryParam filter[is_active] boolean Lọc theo trạng thái hoạt động (1: Active, 0: Inactive). Example: 1
     * @queryParam filter[unit] string Lọc theo đơn vị tính. Example: kwh
     * @queryParam sort string Sắp xếp theo trường (prefix '-' để giảm dần). Các trường hỗ trợ: code, name, created_at. Default: code. Example: -created_at
     */
    public function trash(Request $request)
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
    public function restore(string $id)
    {
        $service = $this->service->findTrashed($id);
        if (! $service) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $service);

        $this->service->restore($id);

        return new ServiceResource($service);
    }

    /**
     * Xóa vĩnh viễn dịch vụ
     */
    public function forceDelete(string $id)
    {
        $service = $this->service->findWithTrashed($id);
        if (! $service) return response()->json(['message' => 'Not Found'], 404);

        $this->authorize('delete', $service);

        $this->service->forceDelete($id);

        return response()->json(['message' => 'Permanently deleted successfully']);
    }
}
