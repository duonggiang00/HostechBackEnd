<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meter\MeterReadingBulkStoreRequest;
use App\Http\Requests\Meter\MeterReadingRejectRequest;
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
     * Chốt số hàng loạt cho nhiều đồng hồ.
     */
    public function bulkStore(MeterReadingBulkStoreRequest $request)
    {
        $this->authorize('create', MeterReading::class);

        $readings = $this->service->bulkStore($request->validated()['readings']);

        return MeterReadingResource::collection($readings);
    }

    /**
     * Lấy danh sách Lịch sử chốt chỉ số của một đồng hồ.
     *
     * @queryParam filter[status] string Trạng thái (DRAFT, SUBMITTED, APPROVED, REJECTED).
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
     * Tạo mới chốt chỉ số (luôn ở trạng thái DRAFT).
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
     * Xem chi tiết một chốt chỉ số.
     */
    public function show(string $meterId, MeterReading $reading)
    {
        $this->authorize('view', $reading);

        return new MeterReadingResource($reading->load(['meter', 'submittedBy', 'approvedBy', 'rejectedBy', 'media']));
    }

    /**
     * Cập nhật thông tin chốt chỉ số (chỉ khi DRAFT hoặc REJECTED).
     */
    public function update(MeterReadingUpdateRequest $request, string $meterId, MeterReading $reading)
    {
        $this->authorize('update', $reading);

        $updatedReading = $this->service->update($reading, $request->validated());

        return new MeterReadingResource($updatedReading);
    }

    /**
     * Xóa chốt chỉ số.
     */
    public function destroy(string $meterId, MeterReading $reading)
    {
        $this->authorize('delete', $reading);

        $this->service->delete($reading);

        return response()->noContent();
    }

    // ═══════════════════════════════════════════════════════════════
    //  WORKFLOW ACTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Staff gửi duyệt chốt số (DRAFT/REJECTED → SUBMITTED).
     */
    public function submit(string $meterId, MeterReading $reading)
    {
        $this->authorize('submit', $reading);

        $result = $this->service->submit($reading);

        return new MeterReadingResource($result);
    }

    /**
     * Manager duyệt chốt số (SUBMITTED → APPROVED).
     */
    public function approve(string $meterId, MeterReading $reading)
    {
        $this->authorize('approve', $reading);

        $result = $this->service->approve($reading);

        return new MeterReadingResource($result);
    }

    /**
     * Manager từ chối chốt số (SUBMITTED → REJECTED).
     */
    public function reject(MeterReadingRejectRequest $request, string $meterId, MeterReading $reading)
    {
        $this->authorize('approve', $reading); // reuse approve permission

        $result = $this->service->reject($reading, $request->validated()['rejection_reason']);

        return new MeterReadingResource($result);
    }

    /**
     * Gửi duyệt hàng loạt nhiều chốt số.
     */
    public function bulkSubmit(Request $request)
    {
        $request->validate([
            'reading_ids' => 'required|array|min:1',
            'reading_ids.*' => 'uuid|exists:meter_readings,id',
        ]);

        $results = $this->service->bulkSubmit($request->input('reading_ids'));

        return MeterReadingResource::collection($results);
    }
}
