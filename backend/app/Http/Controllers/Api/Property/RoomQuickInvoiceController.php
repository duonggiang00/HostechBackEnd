<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Models\Contract\Contract;
use App\Models\Meter\Meter;
use App\Models\Meter\MeterReading;
use App\Models\Property\Room;
use App\Services\Invoice\RecurringBillingService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

#[Group('Quản lý Phòng')]
class RoomQuickInvoiceController extends Controller
{
    public function __construct(
        protected RecurringBillingService $billingService
    ) {}

    /**
     * Chốt tiền tháng (Quick Invoice)
     *
     * Cho phép chốt số điện nước và tạo hóa đơn nhanh cho một phòng cụ thể.
     * Cần nhập ngày bắt đầu, kết thúc chu kỳ và chỉ số mới của các đồng hồ.
     *
     * @bodyParam period_start date required Ngày bắt đầu chu kỳ. Example: 2024-03-01
     * @bodyParam period_end date required Ngày kết thúc chu kỳ. Example: 2024-03-31
     * @bodyParam readings object[] required Danh sách các chỉ số đồng hồ mới.
     * @bodyParam readings[].meter_id string required ID của đồng hồ.
     * @bodyParam readings[].value numeric required Chỉ số mới.
     */
    public function create(Request $request, string $id): JsonResponse
    {
        $room = Room::findOrFail($id);

        $this->authorize('update', clone $room->property); // Kiểm tra quyền truy cập property

        $validated = $request->validate([
            'period_start' => 'required|date',
            'period_end'   => 'required|date|after_or_equal:period_start',
            'readings'     => 'required|array',
            'readings.*.meter_id' => 'required|uuid|exists:meters,id',
            'readings.*.value'    => 'required|numeric|min:0',
        ]);

        $contract = Contract::where('room_id', $room->id)
            ->whereIn('status', ['ACTIVE', 'PENDING_TERMINATION'])
            ->first();

        if (! $contract) {
            return response()->json(['message' => 'Phòng này không có hợp đồng đang hiệu lực để chốt số.'], 400);
        }

        $periodStart = Carbon::parse($validated['period_start']);
        $periodEnd = Carbon::parse($validated['period_end']);

        try {
            $invoice = DB::transaction(function () use ($validated, $contract, $periodStart, $periodEnd) {
                // 1. Ghi nhận chỉ số mới cho các đồng hồ
                foreach ($validated['readings'] as $readingData) {
                    $meter = Meter::find($readingData['meter_id']);
                    
                    if ($meter && $meter->room_id === $contract->room_id) {
                        // Kiểm tra nếu đã có reading trong tháng này thì cập nhật, nếu chưa thì tạo mới
                        $existingReading = MeterReading::where('meter_id', $meter->id)
                            ->where('period_start', $periodStart->toDateString())
                            ->where('period_end', $periodEnd->toDateString())
                            ->first();

                        if ($existingReading) {
                            $existingReading->update([
                                'reading_value' => $readingData['value'],
                                'reading_date'  => now(),
                                'status'        => 'APPROVED', // Chốt số do quản lý làm nên được auto-approve
                                'approved_by_user_id' => request()->user()?->id,
                                'approved_at'   => now(),
                            ]);
                        } else {
                            MeterReading::create([
                                'org_id'         => $meter->org_id,
                                'property_id'    => $meter->property_id,
                                'meter_id'       => $meter->id,
                                'period_start'   => $periodStart->toDateString(),
                                'period_end'     => $periodEnd->toDateString(),
                                'reading_date'   => now(),
                                'reading_value'  => $readingData['value'],
                                'proof_image'    => null, // Chốt tay không bắt buộc ảnh
                                'status'         => 'APPROVED',
                                'notes'          => 'Chốt bằng công cụ Tạo hóa đơn nhanh.',
                                'submitted_by_user_id' => request()->user()?->id,
                                'approved_by_user_id'  => request()->user()?->id,
                                'approved_at'    => now(),
                            ]);
                        }
                    }
                }

                // 2. Tạo hóa đơn
                // RecurringBillingService sẽ sử dụng $periodEnd (ngày đóng chu kỳ) như periodMonth để check,
                // nhưng ta sẽ trỏ periodStart và periodEnd theo custom để nó lấy logic đúng.
                return $this->billingService->generateInvoiceForContract(
                    contract: $contract,
                    periodMonth: $periodEnd,
                    customPeriodStart: $periodStart,
                    customPeriodEnd: $periodEnd
                );
            });

            return response()->json([
                'message' => 'Đã chốt số và tạo hóa đơn thành công.',
                'invoice' => $invoice
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi tạo hóa đơn: ' . $e->getMessage()
            ], 422);
        }
    }
}
