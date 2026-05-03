<?php

namespace App\Http\Controllers\Api\Meter;

use App\Http\Controllers\Controller;
use App\Http\Requests\Meter\MeterReadingFinalizeApprovedRequest;
use App\Http\Resources\Meter\MeterReadingResource;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Property\Room;
use App\Services\Meter\MeterReadingService;
use Illuminate\Validation\ValidationException;

/**
 * Chốt chỉ số đồng hồ phòng và APPROVED trong một bước (wizard thanh lý / quản lý).
 * Khác bulk-readings mặc định: cho phép ghi đè bản SUBMITTED cùng kỳ → APPROVED.
 */
class RoomMeterReadingFinalizeController extends Controller
{
    public function __construct(
        protected MeterReadingService $meterReadingService
    ) {}

    public function store(MeterReadingFinalizeApprovedRequest $request, string $room)
    {
        $roomModel = Room::query()->findOrFail($room);

        $this->authorize('view', $roomModel);
        $this->authorize('approve', MeterReading::class);

        $validated = $request->validated();
        $periodStart = $validated['period_start'];
        $periodEnd = $validated['period_end'];

        $meterIds = collect($validated['readings'])->pluck('meter_id')->unique()->values();
        $countOnRoom = Meter::query()
            ->where('room_id', $roomModel->id)
            ->whereIn('id', $meterIds)
            ->count();

        if ($countOnRoom !== $meterIds->count()) {
            throw ValidationException::withMessages([
                'readings' => 'Một hoặc nhiều đồng hồ không thuộc phòng này.',
            ]);
        }

        $payload = collect($validated['readings'])->map(fn (array $row) => [
            'meter_id' => $row['meter_id'],
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'reading_value' => (int) $row['reading_value'],
        ])->all();

        $results = $this->meterReadingService->finalizeReadingsApproved($payload);

        return MeterReadingResource::collection(collect($results));
    }
}
