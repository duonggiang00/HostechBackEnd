<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meter\MeterReadingStoreRequest;
use App\Http\Requests\Meter\MeterReadingUpdateRequest;
use App\Http\Resources\Meter\MeterReadingResource;
use App\Models\Meter\MeterReading;
use App\Services\Meter\MeterReadingService;
use Illuminate\Http\Request;

class MeterReadingController extends Controller
{
    public function __construct(
        protected MeterReadingService $service
    ) {}

    /**
     * Lấy danh sách Lịch sử chốt chỉ số của một đồng hồ.
     *
     * @queryParam filter[status] string Trạng thái (PENDING, APPROVED, REJECTED).
     */
    public function index(Request $request, string $meterId)
    {
        $this->authorize('viewAny', MeterReading::class);

        $filters = array_merge($request->query('filter', []), ['meter_id' => $meterId]);

        $readings = $this->service->paginate(
            $filters,
            $request->query('per_page', 15),
            $request->query('search')
        );

        return MeterReadingResource::collection($readings);
    }

    /**
     * Tạo mới Lịch sử chốt chỉ số.
     */
    public function store(MeterReadingStoreRequest $request, string $meterId)
    {
        $this->authorize('create', MeterReading::class);

        $data = array_merge($request->validated(), [
            'org_id' => auth()->user()->org_id,
            'meter_id' => $meterId,
        ]);

        $reading = $this->service->create($data);

        return new MeterReadingResource($reading);
    }

    /**
     * Xem chi tiết một Lịch sử chốt chỉ số.
     */
    public function show(string $meterId, MeterReading $reading)
    {
        $this->authorize('view', $reading);

        return new MeterReadingResource($reading->load(['meter', 'submittedBy', 'approvedBy']));
    }

    /**
     * Cập nhật thông tin Lịch sử chốt chỉ số (Duyệt, từ chối...).
     */
    public function update(MeterReadingUpdateRequest $request, string $meterId, MeterReading $reading)
    {
        $this->authorize('update', $reading);

        $updatedReading = $this->service->update($reading, $request->validated());

        return new MeterReadingResource($updatedReading);
    }

    /**
     * Xóa Lịch sử chốt chỉ số.
     */
    public function destroy(string $meterId, MeterReading $reading)
    {
        $this->authorize('delete', $reading);

        $this->service->delete($reading);

        return response()->noContent();
    }
}
