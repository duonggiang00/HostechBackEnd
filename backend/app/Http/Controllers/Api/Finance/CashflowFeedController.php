<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Models\Org\User;
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
                'id, '.
                "CAST('IN' AS CHAR(3)) as direction, ".
                "CAST('payment' AS CHAR(30)) as kind, ".
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
                'id, '.
                "CAST('OUT' AS CHAR(3)) as direction, ".
                "CAST('refund_receipt' AS CHAR(30)) as kind, ".
                'reference, '.
                'amount, '.
                'paid_at as occurred_at, '.
                'paid_by_user_id as actor_user_id, '.
                'contract_id'
            );

        // Cấn trừ cọc khi quyết toán thanh lý → IN (tiền cọc giải ngân vào quỹ).
        $depositSettlementsQ = LedgerEntry::query()
            ->withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->where('ref_type', 'termination_deposit_allocation')
            ->where('meta->account', LedgerEntry::ACCOUNT_CASH_BANK)
            ->when($propertyId, fn ($q) => $q->where('meta->property_id', $propertyId))
            ->when($from, fn ($q) => $q->where('occurred_at', '>=', $from.' 00:00:00'))
            ->when($to, fn ($q) => $q->where('occurred_at', '<=', $to.' 23:59:59'))
            ->selectRaw(
                'id, '.
                "CAST('IN' AS CHAR(3)) as direction, ".
                "CAST('deposit_settlement' AS CHAR(30)) as kind, ".
                "meta->>'$.reference' as reference, ".
                'debit as amount, '.
                'occurred_at, '.
                'CAST(NULL AS CHAR(36)) as actor_user_id, '.
                "meta->>'$.contract_id' as contract_id"
            );

        if ($direction === 'IN') {
            $unionQ = $paymentsQ->unionAll($depositSettlementsQ);
        } elseif ($direction === 'OUT') {
            $unionQ = $refundsQ;
        } else {
            $unionQ = $paymentsQ->unionAll($refundsQ)->unionAll($depositSettlementsQ);
        }

        $base = DB::query()->fromSub($unionQ, 'feed');

        $total = (clone $base)->count();
        $rawRows = $base
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->forPage($page, $perPage)
            ->get();

        // Batch-load actor names for payment rows (actor_user_id = payer_user_id)
        $actorUserIds = $rawRows->pluck('actor_user_id')->filter()->unique()->values();
        $userNames = $actorUserIds->isNotEmpty()
            ? User::whereIn('id', $actorUserIds)->pluck('full_name', 'id')
            : collect();

        // Batch-load tenant names for refund_receipt rows
        $refundIds = $rawRows->where('kind', 'refund_receipt')->pluck('id')->filter()->values();
        $refundTenantNames = collect();
        if ($refundIds->isNotEmpty()) {
            $refundTenantNames = RefundReceipt::with('contract.primaryMember')
                ->whereIn('id', $refundIds)
                ->get()
                ->mapWithKeys(fn ($r) => [
                    (string) $r->id => $r->contract?->primaryMember?->full_name,
                ]);
        }

        // Batch-load meta descriptions for payment rows (written at ledger-write time)
        $paymentIds = $rawRows->where('kind', 'payment')->pluck('id')->filter()->values();
        $paymentMeta = collect();
        if ($paymentIds->isNotEmpty()) {
            $paymentMeta = LedgerEntry::withoutGlobalScope('org_id')
                ->where('ref_type', 'payment')
                ->where('meta->account', LedgerEntry::ACCOUNT_CASH_BANK)
                ->whereIn('ref_id', $paymentIds)
                ->get(['ref_id', 'meta'])
                ->mapWithKeys(fn ($e) => [(string) $e->ref_id => $e->meta]);
        }

        $rows = $rawRows->map(function ($r) use ($userNames, $refundTenantNames, $paymentMeta) {
            $kind = (string) $r->kind;
            $actorUserId = $r->actor_user_id ? (string) $r->actor_user_id : null;
            $id = (string) $r->id;

            $actorName = null;
            $description = null;

            if ($kind === 'payment') {
                $meta = $paymentMeta->get($id);
                $actorName = $meta['payer_name'] ?? ($actorUserId ? $userNames->get($actorUserId) : null);
                $description = $meta['description'] ?? ($actorName ? "Khách {$actorName} thanh toán" : 'Thanh toán');
            } elseif ($kind === 'refund_receipt') {
                $actorName = $refundTenantNames->get($id);
                $description = $actorName ? "Hoàn trả tiền cọc cho khách {$actorName}" : 'Hoàn trả tiền cọc';
            } elseif ($kind === 'deposit_settlement') {
                $actorName = null;
                $description = 'Cấn trừ cọc quyết toán thanh lý';
            }

            return [
                'id' => $id,
                'direction' => (string) $r->direction,
                'kind' => $kind,
                'reference' => $r->reference !== null ? (string) $r->reference : null,
                'amount' => (float) $r->amount,
                'occurred_at' => $r->occurred_at,
                'actor_user_id' => $actorUserId,
                'contract_id' => $r->contract_id ? (string) $r->contract_id : null,
                'actor_name' => $actorName,
                'description' => $description,
            ];
        })->values();

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
