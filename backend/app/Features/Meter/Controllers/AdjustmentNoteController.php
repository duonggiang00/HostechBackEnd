<?php

namespace App\Features\Meter\Controllers;

use App\Http\Controllers\Controller;
use App\Features\Meter\Requests\ApproveAdjustmentNoteRequest;
use App\Features\Meter\Requests\RejectAdjustmentNoteRequest;
use App\Features\Meter\Requests\StoreAdjustmentNoteRequest;
use App\Features\Meter\Resources\AdjustmentNoteResource;
use App\Features\Meter\Models\AdjustmentNote;
use App\Features\Meter\Models\MeterReading;
use App\Features\Meter\Services\AdjustmentNoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdjustmentNoteController extends Controller
{
    protected $adjustmentNoteService;

    public function __construct(AdjustmentNoteService $adjustmentNoteService)
    {
        $this->adjustmentNoteService = $adjustmentNoteService;
    }

    /**
     * Lấy danh sách phiếu xin sửa chỉ số của 1 chốt sổ
     */
    public function index(MeterReading $reading): AnonymousResourceCollection
    {
        $notes = $this->adjustmentNoteService->indexForReading($reading->id);

        return AdjustmentNoteResource::collection($notes);
    }

    /**
     * Tạo phiếu xin sửa chỉ số
     */
    public function store(StoreAdjustmentNoteRequest $request, MeterReading $reading): JsonResponse
    {
        $adjustmentNote = $this->adjustmentNoteService->create($reading, $request->validated());

        return response()->json([
            'message' => 'Adjustment note created successfully',
            'data' => new AdjustmentNoteResource($adjustmentNote->load('media')),
        ], 201);
    }

    /**
     * Duyệt phiếu xin sửa chỉ số
     */
    public function approve(ApproveAdjustmentNoteRequest $request, MeterReading $reading, AdjustmentNote $adjustment): JsonResponse
    {
        // Ensure note belongs to reading
        if ($adjustment->meter_reading_id !== $reading->id) {
            abort(404, 'Adjustment note not found for this meter reading');
        }

        $approvedNote = $this->adjustmentNoteService->approve($adjustment);

        return response()->json([
            'message' => 'Adjustment note approved successfully',
            'data' => new AdjustmentNoteResource($approvedNote),
        ]);
    }

    /**
     * Từ chối phiếu xin sửa chỉ số
     */
    public function reject(RejectAdjustmentNoteRequest $request, MeterReading $reading, AdjustmentNote $adjustment): JsonResponse
    {
        // Ensure note belongs to reading
        if ($adjustment->meter_reading_id !== $reading->id) {
            abort(404, 'Adjustment note not found for this meter reading');
        }

        $rejectedNote = $this->adjustmentNoteService->reject($adjustment, $request->validated('reject_reason'));

        return response()->json([
            'message' => 'Adjustment note rejected successfully',
            'data' => new AdjustmentNoteResource($rejectedNote),
        ]);
    }
}
