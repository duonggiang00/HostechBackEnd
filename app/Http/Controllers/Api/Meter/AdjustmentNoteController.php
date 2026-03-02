<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meter\ApproveAdjustmentNoteRequest;
use App\Http\Requests\Meter\RejectAdjustmentNoteRequest;
use App\Http\Requests\Meter\StoreAdjustmentNoteRequest;
use App\Http\Resources\Meter\AdjustmentNoteResource;
use App\Models\Meter\AdjustmentNote;
use App\Models\Meter\MeterReading;
use App\Services\Meter\AdjustmentNoteService;

class AdjustmentNoteController extends Controller
{
    protected $adjustmentNoteService;

    public function __construct(AdjustmentNoteService $adjustmentNoteService)
    {
        $this->adjustmentNoteService = $adjustmentNoteService;
    }

    /**
     * Lấy danh sách phiếu xin sửa chỉ số của 1 chốt sổ
     *
     * @tags Quản lý Phiếu Sửa Chỉ Số (Adjustment Notes)
     */
    public function index(MeterReading $reading)
    {
        // Require authorization? Usually Owner/Manager or specific policies
        // $this->authorize('viewAny', AdjustmentNote::class);
        
        $notes = $this->adjustmentNoteService->indexForReading($reading->id);
        return AdjustmentNoteResource::collection($notes);
    }

    /**
     * Tạo phiếu xin sửa chỉ số
     *
     * @tags Quản lý Phiếu Sửa Chỉ Số (Adjustment Notes)
     */
    public function store(StoreAdjustmentNoteRequest $request, MeterReading $reading)
    {
        // $this->authorize('create', AdjustmentNote::class);
        
        $adjustmentNote = $this->adjustmentNoteService->create($reading, $request->validated());

        return response()->json([
            'message' => 'Adjustment note created successfully',
            'data' => new AdjustmentNoteResource($adjustmentNote->load('media'))
        ], 201);
    }

    /**
     * Duyệt phiếu xin sửa chỉ số
     *
     * Cập nhật chỉ số mới vào hoá đơn và đồng hồ gốc.
     *
     * @tags Quản lý Phiếu Sửa Chỉ Số (Adjustment Notes)
     */
    public function approve(ApproveAdjustmentNoteRequest $request, MeterReading $reading, AdjustmentNote $adjustment)
    {
        // $this->authorize('update', $adjustment);
        
        // Ensure note belongs to reading
        if ($adjustment->meter_reading_id !== $reading->id) {
            abort(404, 'Adjustment note not found for this meter reading');
        }

        $approvedNote = $this->adjustmentNoteService->approve($adjustment);

        return response()->json([
            'message' => 'Adjustment note approved successfully',
            'data' => new AdjustmentNoteResource($approvedNote)
        ]);
    }
    
    /**
     * Từ chối phiếu xin sửa chỉ số
     *
     * @tags Quản lý Phiếu Sửa Chỉ Số (Adjustment Notes)
     */
    public function reject(RejectAdjustmentNoteRequest $request, MeterReading $reading, AdjustmentNote $adjustment)
    {
        // $this->authorize('update', $adjustment);
        
        // Ensure note belongs to reading
        if ($adjustment->meter_reading_id !== $reading->id) {
            abort(404, 'Adjustment note not found for this meter reading');
        }

        $rejectedNote = $this->adjustmentNoteService->reject($adjustment, $request->validated('reject_reason'));

        return response()->json([
            'message' => 'Adjustment note rejected successfully',
            'data' => new AdjustmentNoteResource($rejectedNote)
        ]);
    }
}
