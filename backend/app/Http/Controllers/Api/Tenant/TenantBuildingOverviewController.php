<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Property\BuildingOverviewResource;
use App\Models\Contract\Contract;
use App\Services\Property\BuildingOverviewService;
use Illuminate\Http\Request;
use Dedoc\Scramble\Attributes\Group;

/**
 * Mặt bằng tòa nhà cư dân (Tenant Building Overview)
 *
 * API cho phép cư dân xem sơ đồ mặt bằng của tòa nhà mình đang ở.
 * Chỉ ở chế độ xem, không bao gồm thông tin nhạy cảm của cư dân khác.
 */
#[Group('Cổng Cư dân')]
class TenantBuildingOverviewController extends Controller
{
    public function __construct(protected BuildingOverviewService $service) {}

    /**
     * Lấy sơ đồ tòa nhà hiện tại của cư dân
     *
     * Tự động xác định tòa nhà cư dân đang ở thông qua hợp đồng ACTIVE.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // 1. Tìm hợp đồng ACTIVE hoặc PENDING_TERMINATION của cư dân
        $contract = Contract::whereHas('members', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->whereIn('status', ['ACTIVE', 'PENDING_TERMINATION'])
            ->with('property')
            ->first();

        if (!$contract || !$contract->property) {
            return response()->json([
                'message' => 'Bạn hiện không có hợp đồng thuê nhà nào đang hoạt động để xem sơ đồ tòa nhà.'
            ], 404);
        }

        // 2. Lấy layout từ service
        $layout = $this->service->getLayout($contract->property);

        // Security: Remove sensitive information for tenants (base_price of all rooms)
        if (isset($layout['property']->floors)) {
            $layout['property']->floors->each(function($floor) {
                $floor->rooms->each(function($room) {
                    $room->base_price = 0;
                });
            });
        }

        // 3. Xử lý dữ liệu nhạy cảm cho Tenant
        // Ghi đè thông tin nhạy cảm trước khi trả về Resource (nếu cần)
        // Hiện tại BuildingOverviewResource trả về toàn bộ Floors/Rooms.
        // Chúng ta có thể filter draft rooms ở đây.
        $layout['templates'] = []; // Tenant không cần xem templates

        return new BuildingOverviewResource($layout);
    }
}
