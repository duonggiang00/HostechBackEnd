<?php

namespace App\Features\Meter\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Meter\Requests\MeterReadingBulkStoreRequest;
use App\Features\Meter\Requests\MeterReadingStoreRequest;
use App\Features\Meter\Requests\MeterReadingUpdateRequest;
use App\Features\Meter\Resources\MeterReadingResource;
use App\Features\Meter\Models\MeterReading;
use App\Features\Meter\Services\MeterReadingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

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
            'org_id' => Auth::user()?->org_id,
            'meter_id' => $meterId,
        ]);

        $reading = $this->service->create($data);

        return new MeterReadingResource($reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']));
    }

    /**
     * Xem chi tiết một Lịch sử chốt chỉ số.
     */
    public function show(string $meterId, MeterReading $reading)
    {
        $this->authorize('view', $reading);

        return new MeterReadingResource($reading->fresh()->load(['meter', 'submittedBy', 'approvedBy']));
    }

    /**
     * Cập nhật thông tin Lịch sử chốt chỉ số (Duyệt, từ chối...).
     */
    public function update(MeterReadingUpdateRequest $request, string $meterId, MeterReading $reading)
    {
        // Check if this is an approval/rejection action
        if (isset($request->validated()['status']) && in_array($request->validated()['status'], ['APPROVED', 'REJECTED'])) {
            $this->authorize('approve', $reading);
        } else {
            $this->authorize('update', $reading);
        }

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

    // ═══════════════════════════════════════════════════════════════
    //  WORKFLOW ACTIONS
    // ═══════════════════════════════════════════════════════════════

    /**
     * Staff gửi duyệt chốt số (DRAFT/REJECTED → SUBMITTED).
     */
    public function submit(string $meterId, MeterReading $reading)
    {
        $this->authorize('update', $reading);

        $result = $this->service->update($reading, ['status' => 'SUBMITTED']);

        return new MeterReadingResource($result);
    }

    /**
     * Manager duyệt chốt số (SUBMITTED → APPROVED).
     */
    public function approve(string $meterId, MeterReading $reading)
    {
        $this->authorize('approve', $reading);

        $result = $this->service->update($reading, ['status' => 'APPROVED']);

        return new MeterReadingResource($result);
    }

    /**
     * Manager từ chối chốt số (SUBMITTED → REJECTED).
     */
    public function reject(Request $request, string $meterId, MeterReading $reading)
    {
        $this->authorize('approve', $reading);

        $reason = $request->input('rejection_reason', '');

        $result = $this->service->update($reading, [
            'status' => 'REJECTED',
            'rejection_reason' => $reason,
            'meta' => $reason ? ['rejection_reason' => $reason] : [],
        ]);

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

        $readings = MeterReading::whereIn('id', $request->input('reading_ids'))->get();
        $results = [];

        foreach ($readings as $reading) {
            $this->authorize('update', $reading);
            $results[] = $this->service->update($reading, ['status' => 'SUBMITTED']);
        }

        return MeterReadingResource::collection(collect($results));
    }
}
