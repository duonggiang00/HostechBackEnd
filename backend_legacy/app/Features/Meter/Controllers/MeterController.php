<?php

namespace App\Features\Meter\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Meter\Requests\MeterIndexRequest;
use App\Features\Meter\Requests\MeterStoreRequest;
use App\Features\Meter\Requests\MeterUpdateRequest;
use App\Features\Meter\Resources\MeterResource;
use App\Features\Meter\Models\Meter;
use App\Features\Meter\Services\MeterService;
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
     */
    public function indexByFloor(Request $request, string $propertyId, string $floorId): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Meter::class);

        // Bơm sẵn filter floor_id.
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
     */
    public function store(MeterStoreRequest $request): MeterResource
    {
        $this->authorize('create', Meter::class);

        $meter = $this->service->create($request->validated());

        return new MeterResource($meter);
    }

    /**
     * Xem chi tiết Đồng hồ.
     */
    public function show(Meter $meter): MeterResource
    {
        $this->authorize('view', $meter);

        return new MeterResource($meter->load(['room.property', 'room.floor', 'latestApprovedReading']));
    }

    /**
     * Cập nhật Đồng hồ.
     */
    public function update(MeterUpdateRequest $request, Meter $meter): MeterResource
    {
        $this->authorize('update', $meter);

        $updatedMeter = $this->service->update($meter, $request->validated());

        return new MeterResource($updatedMeter);
    }

    /**
     * Xóa mềm Đồng hồ.
     */
    public function destroy(Meter $meter): Response
    {
        $this->authorize('delete', $meter);

        $this->service->delete($meter);

        return response()->noContent();
    }

    /**
     * Lấy thống kê Đồng hồ theo Tòa nhà.
     */
    public function statisticsByProperty(Request $request, string $propertyId): \Illuminate\Http\JsonResponse
    {
        $this->authorize('viewAny', Meter::class);

        $filters = array_merge($request->query('filter', []), ['property_id' => $propertyId]);

        $stats = $this->service->getStatistics($filters, $propertyId);

        return response()->json([
            'data' => $stats,
            'message' => 'Meter statistics retrieved successfully',
        ]);
    }
}
