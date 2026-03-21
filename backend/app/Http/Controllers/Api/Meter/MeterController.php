<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meter\MeterIndexRequest;
use App\Http\Requests\Meter\MeterStoreRequest;
use App\Http\Requests\Meter\MeterUpdateRequest;
use App\Http\Resources\Meter\MeterResource;
use App\Models\Meter\Meter;
use App\Services\Meter\MeterService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class MeterController extends Controller
{
    public function __construct(
        protected MeterService $service
    ) {}

    /**
     * Lấy danh sách Đồng hồ.
     *
     * Cung cấp danh sách các đồng hồ điện/nước trong hệ thống. Hỗ trợ lọc, tìm kiếm và phân trang.
     */
    public function index(MeterIndexRequest $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Meter::class);

        $meters = $this->service->paginate(
            $request->query('filter', []),
            $request->query('per_page', 15),
            $request->query('search')
        );

        return MeterResource::collection($meters);
    }

    /**
     * Lấy danh sách Đồng hồ theo Tòa nhà.
     *
     * Trả về danh sách tất cả các đồng hồ gắn với các phòng thuộc Tòa nhà (Property) cụ thể. Hỗ trợ đầy đủ filter, sort như API index.
     *
     * @queryParam filter[type] string Lọc theo loại đồng hồ (ELECTRIC, WATER).
     * @queryParam filter[is_active] boolean Lọc theo trạng thái.
     * @queryParam sort string Sắp xếp. Mặc định: -created_at.
     * @queryParam search string Tìm kiếm theo mã đồng hồ (code) hoặc tên phòng.
     * @queryParam per_page integer Số bản ghi trên trang.
     */
    public function indexByProperty(Request $request, string $propertyId): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Meter::class);

        // Bơm sẵn filter property_id vào request để xử lý
        $filters = array_merge($request->query('filter', []), ['property_id' => $propertyId]);

        $meters = $this->service->paginate(
            $filters,
            $request->query('per_page', 15),
            $request->query('search')
        );

        return MeterResource::collection($meters);
    }

    /**
     * Lấy danh sách Đồng hồ theo Tầng.
     *
     * Trả về danh sách tất cả đồng hồ của các phòng thuộc một Tầng cụ thể trong Tòa nhà.
     *
     * @queryParam filter[type] string Lọc theo loại đồng hồ (ELECTRIC, WATER).
     * @queryParam sort string Sắp xếp. Mặc định: -created_at.
     * @queryParam search string Tìm theo mã.
     */
    public function indexByFloor(Request $request, string $propertyId, string $floorId): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Meter::class);

        // Bơm sẵn filter floor_id. (propertyId được truyền route nhằm logic chặt chẽ URL nếu cần ở middleware sau này)
        $filters = array_merge($request->query('filter', []), ['floor_id' => $floorId]);

        $meters = $this->service->paginate(
            $filters,
            $request->query('per_page', 15),
            $request->query('search')
        );

        return MeterResource::collection($meters);
    }

    /**
     * Tạo mới Đồng hồ.
     *
     * Khởi tạo một đồng hồ mới và gắn nó vào một phòng.
     */
    public function store(MeterStoreRequest $request): MeterResource
    {
        $this->authorize('create', Meter::class);

        $meter = $this->service->create($request->validated());

        return new MeterResource($meter);
    }

    /**
     * Xem chi tiết Đồng hồ.
     *
     * Trả về thông tin chi tiết một đồng hồ.
     */
    public function show(Meter $meter): MeterResource
    {
        $this->authorize('view', $meter);

        return new MeterResource($meter->load(['room.property', 'room.floor', 'latestReading']));
    }

    /**
     * Cập nhật Đồng hồ.
     *
     * Thay đổi thông tin đồng hồ đang có (ví dụ: gỡ bỏ, đổi mã, đổi phòng).
     */
    public function update(MeterUpdateRequest $request, Meter $meter): MeterResource
    {
        $this->authorize('update', $meter);

        $updatedMeter = $this->service->update($meter, $request->validated());

        return new MeterResource($updatedMeter);
    }

    /**
     * Xóa mềm Đồng hồ.
     *
     * Đưa đồng hồ vào trạng thái "đã xóa tạm thời" (Soft Delete).
     */
    public function destroy(Meter $meter): Response
    {
        $this->authorize('delete', $meter);

        $this->service->delete($meter);

        return response()->noContent();
    }

    /**
     * Lấy thống kê Đồng hồ theo Tòa nhà.
     *
     * Trả về thống kê tổng số đồng hồ, chỉ số tiêu thụ, v.v.
     */
    public function statisticsByProperty(Request $request, string $propertyId): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Meter::class);

        $filters = array_merge($request->query('filter', []), ['property_id' => $propertyId]);

        $stats = $this->service->getStatistics($filters, $propertyId);

        return response()->json($stats);
    }
}
