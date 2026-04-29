<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Resources\Meter\MeterResource;
use App\Models\Contract\Contract;
use App\Models\Meter\Meter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantMeterController extends Controller
{
    /**
     * Danh sách đồng hồ gắn phòng của cư dân (chỉ số đã chốt / cơ sở), chỉ đọc.
     */
    public function myMeters(Request $request): JsonResponse
    {
        $user = $request->user();

        $contract = Contract::query()
            ->whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id)->where('status', 'APPROVED');
            })
            ->whereIn('status', ['ACTIVE', 'PENDING_TERMINATION'])
            ->first();

        if (! $contract?->room_id) {
            return response()->json(['data' => []]);
        }

        $meters = Meter::query()
            ->where('room_id', $contract->room_id)
            ->where('is_active', true)
            ->with(['room.property', 'latestApprovedReading'])
            ->orderBy('type')
            ->get();

        return response()->json([
            'data' => MeterResource::collection($meters)->resolve(),
        ]);
    }

    /**
     * Gửi chỉ số qua app cư dân đã tắt — chốt số do ban quản lý thực hiện.
     */
    public function submit(Request $request): never
    {
        abort(403, 'Ứng dụng cư dân chỉ cho phép xem chỉ số. Vui lòng liên hệ ban quản lý để ghi nhận chỉ số.');
    }
}
