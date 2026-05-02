<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\Payment;
use App\Services\TenantManager;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

/**
 * Dòng tiền thực tế hợp nhất — nguồn dữ liệu cho tab "Dòng tiền tất cả" của trang Sổ cái.
 *
 * Hợp nhất 2 nguồn:
 * - Payment (status=APPROVED) → IN (tiền vào quỹ).
 * - RefundReceipt (paid_at IS NOT NULL) → OUT (tiền hoàn trả khách).
 *
 * Sort theo occurred_at desc, paginate ở server bằng UNION ALL.
 */
#[Group('Tài chính – Dòng tiền hợp nhất')]
class CashflowFeedController extends Controller
{
    protected function resolveOrgId(Request $request): ?string
    {
        $user = $request->user();
        if (! $user) {
            return null;
        }

        $fromContext = TenantManager::getOrgId();
        if ($fromContext) {
            return (string) $fromContext;
        }

        $headerOrQuery = $request->header('X-Org-Id') ?: $request->input('org_id');
        if ($headerOrQuery) {
            return (string) $headerOrQuery;
        }

        return $user->org_id ? (string) $user->org_id : null;
    }

    /**
     * Danh sách dòng tiền thực tế (IN/OUT) — có thể lọc theo property + khoảng ngày.
     *
     * @queryParam per_page int Example: 20
     * @queryParam filter[property_id] uuid Lọc theo tòa.
     * @queryParam filter[occurred_between] string Y-m-d,Y-m-d theo occurred_at.
     * @queryParam filter[direction] string IN | OUT — lọc 1 chiều.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewLedger', Payment::class);

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.occurred_between' => ['nullable', 'string'],
            'filter.direction' => ['nullable', 'string', 'in:IN,OUT'],
        ]);

        $perPage = (int) $request->input('per_page', 20);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 20;
        }
        $page = max(1, (int) $request->input('page', 1));

        $orgId = $this->resolveOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $propertyId = $request->input('filter.property_id');
        $direction = $request->input('filter.direction');
        $between = $request->input('filter.occurred_between');
        [$from, $to] = $this->parseBetween($between);

        $paymentsQ = Payment::query()
            ->withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->where('status', 'APPROVED')
            ->whereNull('deleted_at')
            ->when($propertyId, fn ($q) => $q->where('property_id', $propertyId))
            ->when($from, fn ($q) => $q->where('received_at', '>=', $from.' 00:00:00'))
            ->when($to, fn ($q) => $q->where('received_at', '<=', $to.' 23:59:59'))
            ->selectRaw(
                "id, ".
                "CAST('IN' AS CHAR(3)) as direction, ".
                "CAST('payment' AS CHAR(20)) as kind, ".
                'reference, '.
                'amount, '.
                'received_at as occurred_at, '.
                'payer_user_id as actor_user_id, '.
                'CAST(NULL AS CHAR(36)) as contract_id'
            );

        $refundsQ = RefundReceipt::query()
            ->withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->whereNotNull('paid_at')
            ->when($propertyId, fn ($q) => $q->whereHas('contract', fn ($c) => $c->where('property_id', $propertyId)))
            ->when($from, fn ($q) => $q->where('paid_at', '>=', $from.' 00:00:00'))
            ->when($to, fn ($q) => $q->where('paid_at', '<=', $to.' 23:59:59'))
            ->selectRaw(
                "id, ".
                "CAST('OUT' AS CHAR(3)) as direction, ".
                "CAST('refund_receipt' AS CHAR(20)) as kind, ".
                'reference, '.
                'amount, '.
                'paid_at as occurred_at, '.
                'paid_by_user_id as actor_user_id, '.
                'contract_id'
            );

        if ($direction === 'IN') {
            $unionQ = $paymentsQ;
        } elseif ($direction === 'OUT') {
            $unionQ = $refundsQ;
        } else {
            $unionQ = $paymentsQ->unionAll($refundsQ);
        }

        $base = DB::query()->fromSub($unionQ, 'feed');

        $total = (clone $base)->count();
        $rows = $base
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->forPage($page, $perPage)
            ->get()
            ->map(fn ($r) => [
                'id' => (string) $r->id,
                'direction' => (string) $r->direction,
                'kind' => (string) $r->kind,
                'reference' => $r->reference !== null ? (string) $r->reference : null,
                'amount' => (float) $r->amount,
                'occurred_at' => $r->occurred_at,
                'actor_user_id' => $r->actor_user_id ? (string) $r->actor_user_id : null,
                'contract_id' => $r->contract_id ? (string) $r->contract_id : null,
            ])
            ->values();

        $paginator = new LengthAwarePaginator(
            items: $rows,
            total: $total,
            perPage: $perPage,
            currentPage: $page,
            options: [
                'path' => $request->url(),
                'query' => $request->query(),
            ],
        );

        return response()->json([
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    /**
     * @return array{0: ?string, 1: ?string}
     */
    private function parseBetween(?string $between): array
    {
        if (! $between || ! str_contains($between, ',')) {
            return [null, null];
        }
        [$from, $to] = array_map('trim', explode(',', $between, 2));

        return [$from ?: null, $to ?: null];
    }
}
