<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meter\TenantMeterReadingSubmitRequest;
use App\Models\Contract\Contract;
use App\Models\Meter\Meter;
use App\Services\Meter\MeterReadingService;
use Illuminate\Validation\ValidationException;

class TenantMeterController extends Controller
{
    public function __construct(protected MeterReadingService $service)
    {
    }

    public function submit(TenantMeterReadingSubmitRequest $request)
    {
        $user = $request->user();

        // Find active contract for this tenant
        $contract = Contract::whereHas('members', function ($q) use ($user) {
            $q->where('user_id', $user->id)->where('status', 'APPROVED');
        })->where('status', 'ACTIVE')->first();

        if (!$contract || !$contract->room_id) {
            throw ValidationException::withMessages([
                'general' => 'Bạn không có phòng đang hoạt động hợp lệ để gửi chỉ số.'
            ]);
        }

        // Find the meter in this room of the specified type
        $meter = Meter::where('room_id', $contract->room_id)
            ->where('type', $request->type)
            ->first();

        if (!$meter) {
            throw ValidationException::withMessages([
                'type' => 'Không tìm thấy đồng hồ ' . ($request->type === 'ELECTRIC' ? 'điện' : 'nước') . ' cho phòng của bạn.'
            ]);
        }

        $lastReading = $meter->latestApprovedReading;
        $periodStart = $lastReading ? clone $lastReading->period_end : \Carbon\Carbon::parse($contract->start_date);

        // Cần đảm bảo ngày hiện tại sau ngày chốt cuối cùng
        $now = now();
        if ($now->lte($periodStart)) {
            // Fix start date if somehow today is before the last period_end
            $periodStart = $now->copy()->subMonth();
        }

        $data = [
            'meter_id' => $meter->id,
            'reading_value' => $request->reading_value,
            'period_start' => $periodStart->format('Y-m-d'),
            'period_end' => $now->format('Y-m-d'),
            'status' => 'SUBMITTED',
            'proof_media_ids' => $request->photo_id ? [$request->photo_id] : [],
        ];

        $reading = $this->service->create($data);

        return response()->json([
            'message' => 'Gửi chỉ số thành công',
            'data' => $reading
        ], 201);
    }
}
