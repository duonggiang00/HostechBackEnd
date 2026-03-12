<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Dashboard\DashboardService;
use Carbon\Carbon;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[Group('Dashboard')]
class DashboardController extends Controller
{
    public function __construct(protected DashboardService $service) {}

    /**
     * Dashboard tổng quan theo vai trò
     *
     * Trả về dữ liệu dashboard tương ứng với role đang đăng nhập:
     * - Admin: thống kê toàn hệ thống
     * - Owner: thống kê trong tổ chức
     * - Manager/Staff: thống kê theo property được phân công
     *
     * @queryParam from string Ngày bắt đầu lọc theo định dạng Y-m-d. Example: 2026-03-01
     * @queryParam to string Ngày kết thúc lọc theo định dạng Y-m-d, phải >= from. Example: 2026-03-12
     *
     * @responseField role string Vai trò dashboard trả về. Enum: admin, owner, manager, staff.
     * @responseField data object Dữ liệu thống kê theo role.
     * @responseField data.filter object Khoảng thời gian áp dụng cho thống kê.
     * @responseField data.filter.from string Ngày bắt đầu (Y-m-d).
     * @responseField data.filter.to string Ngày kết thúc (Y-m-d).
     * @response 403 scenario="Không có quyền" {"message": "Bạn không có quyền truy cập dashboard."}
     * @response 422 scenario="Validation thất bại" {"message": "The to field must be a date after or equal to from.", "errors": {"to": ["The to field must be a date after or equal to from."]}}
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate($this->dateRules());

        /** @var \App\Models\Org\User $user */
        $user = $request->user();
        [$from, $to] = $this->resolveRange($request);

        if ($user->hasRole('Admin')) {
            return response()->json([
                'role' => 'admin',
                'data' => array_merge(
                    ['filter' => $this->filterPayload($from, $to)],
                    $this->service->getAdminDashboard($from, $to),
                ),
            ]);
        }

        if ($user->hasRole('Owner')) {
            return response()->json([
                'role' => 'owner',
                'data' => array_merge(
                    ['filter' => $this->filterPayload($from, $to)],
                    $this->service->getOwnerDashboard($user, $from, $to),
                ),
            ]);
        }

        if ($user->hasRole(['Manager', 'Staff'])) {
            return response()->json([
                'role' => $user->hasRole('Manager') ? 'manager' : 'staff',
                'data' => array_merge(
                    ['filter' => $this->filterPayload($from, $to)],
                    $this->service->getManagerDashboard($user, $from, $to),
                ),
            ]);
        }

        abort(403, 'Bạn không có quyền truy cập dashboard.');
    }

    /**
     * Dashboard hệ thống cho Admin
     *
     * Chỉ dành cho role Admin. Trả về số liệu tổng quan toàn hệ thống
     * gồm tổ chức, người dùng và bất động sản.
     *
     * @queryParam from string Ngày bắt đầu lọc theo định dạng Y-m-d. Example: 2026-03-01
     * @queryParam to string Ngày kết thúc lọc theo định dạng Y-m-d, phải >= from. Example: 2026-03-12
     *
     * @responseField role string Luôn là admin.
     * @responseField data.filter object Khoảng thời gian áp dụng.
     * @responseField data.organizations object Thống kê tổ chức.
     * @responseField data.organizations.total integer Tổng số tổ chức.
     * @responseField data.organizations.new_in_range integer Số tổ chức mới trong khoảng lọc.
     * @responseField data.organizations.growth_last_6_months array Biểu đồ tăng trưởng 6 tháng gần nhất.
     * @responseField data.users object Thống kê người dùng.
     * @responseField data.users.total integer Tổng số người dùng.
     * @responseField data.users.by_role object Số lượng user theo role (owner, manager, staff, tenant).
     * @responseField data.properties object Thống kê tòa nhà/phòng.
     * @responseField data.properties.total_properties integer Tổng số tòa nhà.
     * @responseField data.properties.total_rooms integer Tổng số phòng.
     * @responseField data.properties.occupied_rooms integer Số phòng đã thuê.
     * @responseField data.properties.available_rooms integer Số phòng trống.
     * @responseField data.properties.occupancy_rate number Tỷ lệ lấp đầy (%).
     * @response 403 scenario="Không có quyền" {"message": "Chỉ Admin mới có quyền truy cập."}
     * @response 422 scenario="Validation thất bại" {"message": "The from field must match the format Y-m-d.", "errors": {"from": ["The from field must match the format Y-m-d."]}}
     */
    public function admin(Request $request): JsonResponse
    {
        $request->validate($this->dateRules());

        /** @var \App\Models\Org\User $user */
        $user = $request->user();

        if (! $user->hasRole('Admin')) {
            abort(403, 'Chỉ Admin mới có quyền truy cập.');
        }

        [$from, $to] = $this->resolveRange($request);

        return response()->json([
            'role' => 'admin',
            'data' => array_merge(
                ['filter' => $this->filterPayload($from, $to)],
                $this->service->getAdminDashboard($from, $to),
            ),
        ]);
    }

    /**
     * Dashboard tổ chức cho Owner
     *
     * Dành cho Admin và Owner. Trả về doanh thu, tình trạng property,
     * nhân sự vận hành và hợp đồng trong tổ chức hiện tại.
     *
     * @queryParam from string Ngày bắt đầu lọc theo định dạng Y-m-d. Example: 2026-03-01
     * @queryParam to string Ngày kết thúc lọc theo định dạng Y-m-d, phải >= from. Example: 2026-03-12
     *
     * @responseField role string Luôn là owner.
     * @responseField data.filter object Khoảng thời gian áp dụng.
     * @responseField data.revenue object Tổng quan doanh thu.
     * @responseField data.revenue.current_period number Doanh thu kỳ hiện tại theo khoảng lọc.
     * @responseField data.revenue.previous_period number Doanh thu kỳ trước có độ dài tương đương.
     * @responseField data.revenue.change_percent number Tỷ lệ tăng/giảm doanh thu (%).
     * @responseField data.properties object Thống kê property trong tổ chức.
     * @responseField data.staff object Số lượng manager/staff đang hoạt động.
     * @responseField data.contracts object Thống kê hợp đồng.
     * @responseField data.contracts.total_active integer Tổng hợp đồng ACTIVE.
     * @responseField data.contracts.expiring_in_30_days integer Hợp đồng sắp hết hạn 30 ngày.
     * @responseField data.contracts.new_in_range integer Hợp đồng ký mới trong khoảng lọc.
     * @response 403 scenario="Không có quyền" {"message": "Chỉ Owner mới có quyền truy cập."}
     * @response 422 scenario="Validation thất bại" {"message": "The to field must be a date after or equal to from.", "errors": {"to": ["The to field must be a date after or equal to from."]}}
     */
    public function owner(Request $request): JsonResponse
    {
        $request->validate($this->dateRules());

        /** @var \App\Models\Org\User $user */
        $user = $request->user();

        if (! $user->hasRole(['Admin', 'Owner'])) {
            abort(403, 'Chỉ Owner mới có quyền truy cập.');
        }

        [$from, $to] = $this->resolveRange($request);

        return response()->json([
            'role' => 'owner',
            'data' => array_merge(
                ['filter' => $this->filterPayload($from, $to)],
                $this->service->getOwnerDashboard($user, $from, $to),
            ),
        ]);
    }

    /**
     * Dashboard vận hành cho Manager/Staff
     *
     * Dành cho Admin, Owner, Manager, Staff. Trả về thống kê tenant,
     * doanh thu, hợp đồng và ticket trên các property được phân công.
     *
     * @queryParam from string Ngày bắt đầu lọc theo định dạng Y-m-d. Example: 2026-03-01
     * @queryParam to string Ngày kết thúc lọc theo định dạng Y-m-d, phải >= from. Example: 2026-03-12
     *
     * @responseField role string Role trả về theo người gọi. Enum: manager, staff.
     * @responseField data.filter object Khoảng thời gian áp dụng.
     * @responseField data.tenants object Thống kê tenant.
     * @responseField data.tenants.active integer Tenant đang ở.
     * @responseField data.tenants.new_in_range integer Tenant mới trong khoảng lọc.
     * @responseField data.revenue object Thống kê doanh thu property được phân công.
     * @responseField data.contracts object Thống kê hợp đồng cần theo dõi.
     * @responseField data.tickets object Thống kê ticket theo nhóm trạng thái.
     * @responseField data.tickets.pending integer OPEN + RECEIVED.
     * @responseField data.tickets.in_progress integer IN_PROGRESS + WAITING_PARTS.
     * @responseField data.tickets.done integer DONE.
     * @responseField data.tickets.cancelled integer CANCELLED.
     * @responseField data.tickets.total integer Tổng ticket.
     * @response 403 scenario="Không có quyền" {"message": "Bạn không có quyền truy cập."}
     * @response 422 scenario="Validation thất bại" {"message": "The from field must match the format Y-m-d.", "errors": {"from": ["The from field must match the format Y-m-d."]}}
     */
    public function manager(Request $request): JsonResponse
    {
        $request->validate($this->dateRules());

        /** @var \App\Models\Org\User $user */
        $user = $request->user();

        if (! $user->hasRole(['Admin', 'Owner', 'Manager', 'Staff'])) {
            abort(403, 'Bạn không có quyền truy cập.');
        }

        [$from, $to] = $this->resolveRange($request);

        return response()->json([
            'role' => $user->hasRole('Manager') ? 'manager' : 'staff',
            'data' => array_merge(
                ['filter' => $this->filterPayload($from, $to)],
                $this->service->getManagerDashboard($user, $from, $to),
            ),
        ]);
    }

    /** @return array{0: Carbon, 1: Carbon} */
    private function resolveRange(Request $request): array
    {
        $from = $request->query('from')
            ? Carbon::createFromFormat('Y-m-d', $request->query('from'))->startOfDay()
            : Carbon::now()->startOfMonth();

        $to = $request->query('to')
            ? Carbon::createFromFormat('Y-m-d', $request->query('to'))->startOfDay()
            : Carbon::today();

        return [$from, $to];
    }

    private function filterPayload(Carbon $from, Carbon $to): array
    {
        return [
            'from' => $from->format('Y-m-d'),
            'to' => $to->format('Y-m-d'),
        ];
    }

    private function dateRules(): array
    {
        return [
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ];
    }
}
