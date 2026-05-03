<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Services\TenantManager;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Dòng ghi nhận sổ khi thu hồi phần cọc còn lại sau quyết toán thanh lý (FORFEIT).
 *
 * Khác với tiền cọc lúc nhận phòng: số đó không tạo dòng ở đây; chỉ khi FORFEIT mới có bút `termination_deposit_forfeit`.
 */
#[Group('Tài chính – Sổ cái')]
class LedgerDepositForfeitFeedController extends Controller
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
     * Danh sách ghi nhận thu hồi cọc vào sổ (LedgerEntry termination_deposit_forfeit).
     *
     * @queryParam per_page int Example: 20
     * @queryParam filter[property_id] uuid Lọc theo meta.property_id
     * @queryParam filter[occurred_between] string Y-m-d,Y-m-d
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewLedger', Payment::class);

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.occurred_between' => ['nullable', 'string'],
        ]);

        $perPage = (int) $request->input('per_page', 20);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 20;
        }
        $page = max(1, (int) $request->input('page', 1));

        $orgId = $this->resolveOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $propertyId = $request->input('filter.property_id');
        $between = $request->input('filter.occurred_between');
        [$from, $to] = $this->parseBetween($between);

        $query = LedgerEntry::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->where('ref_type', LedgerEntry::REF_TYPE_TERMINATION_DEPOSIT_FORFEIT)
            ->when($propertyId, fn ($q) => $q->where('meta->property_id', $propertyId))
            ->when($from, fn ($q) => $q->where('occurred_at', '>=', $from.' 00:00:00'))
            ->when($to, fn ($q) => $q->where('occurred_at', '<=', $to.' 23:59:59'))
            ->orderByDesc('occurred_at')
            ->orderByDesc('id');

        $paginator = $query->paginate($perPage, ['*'], 'page', $page)->withQueryString();

        $rows = collect($paginator->items())->map(function (LedgerEntry $e) {
            $meta = $e->meta ?? [];

            return [
                'id' => $e->id,
                'ledger_entry_id' => $e->id,
                'amount' => (float) $e->debit,
                'occurred_at' => $e->occurred_at?->toIso8601String(),
                'contract_id' => isset($meta['contract_id']) ? (string) $meta['contract_id'] : null,
                'property_id' => isset($meta['property_id']) ? (string) $meta['property_id'] : null,
                'final_invoice_id' => isset($meta['final_invoice_id']) ? (string) $meta['final_invoice_id'] : null,
                'reference' => isset($meta['reference']) ? (string) $meta['reference'] : null,
                'description' => isset($meta['description']) ? (string) $meta['description'] : null,
            ];
        })->values();

        return response()->json([
            'data' => $rows,
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
