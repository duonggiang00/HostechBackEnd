<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\LedgerEntryResource;
use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use App\Services\Finance\LedgerService;
use App\Services\TenantManager;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Phân hệ Sổ cái (Ledger)
 *
 * API truy vấn lịch sử bút toán sổ cái để đối soát tài chính.
 */
#[Group('Tài chính – Sổ cái')]
class LedgerController extends Controller
{
    public function __construct(protected LedgerService $service) {}

    /**
     * org_id dùng cho sổ cái — ưu tiên TenantManager (middleware), sau đó header/query/user.
     */
    protected function resolveLedgerOrgId(Request $request): ?string
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
     * Lịch sử bút toán sổ cái
     *
     * Truy vấn danh sách các bút toán sổ cái. Hỗ trợ lọc theo loại tham chiếu,
     * ID tham chiếu, khoảng thời gian.
     *
     * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
     * @queryParam filter[ref_type] string Loại tham chiếu: payment, payment_reversal. Example: payment
     * @queryParam filter[ref_id] uuid ID tham chiếu (UUID của payment). Example: uuid
     * @queryParam filter[property_id] uuid Lọc theo meta.property_id (khớp phạm vi tòa).
     * @queryParam filter[occurred_between] string Khoảng thời gian (phân cách dấu phẩy). Example: 2024-03-01,2024-03-31
     * @queryParam filter[view] string `cashflow` = chỉ nhánh tiền mặt (CASH_BANK + cashflow_manual); `full` hoặc bỏ qua = toàn bộ bút kép.
     * @queryParam sort string Sắp xếp. Example: -occurred_at
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewLedger', Payment::class);

        $request->validate([
            'filter.view' => ['nullable', 'string', 'in:cashflow,full'],
        ]);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $query = LedgerEntry::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->orderBy('occurred_at', 'desc');

        if ($request->input('filter.view') === 'cashflow') {
            $query->forCashflowReport();
        }

        // Filters
        if ($request->filled('filter.ref_type')) {
            $query->where('ref_type', $request->input('filter.ref_type'));
        }
        if ($request->filled('filter.ref_id')) {
            $query->where('ref_id', $request->input('filter.ref_id'));
        }
        if ($request->filled('filter.property_id')) {
            $query->where('meta->property_id', $request->input('filter.property_id'));
        }

        // Filter: occurred_between=YYYY-MM-DD,YYYY-MM-DD (spec section 3.2)
        $occurredBetween = $request->input('filter.occurred_between');
        if ($occurredBetween && str_contains($occurredBetween, ',')) {
            [$from, $to] = explode(',', $occurredBetween, 2);
            $query->whereBetween('occurred_at', [trim($from).' 00:00:00', trim($to).' 23:59:59']);
        }

        $paginator = $query->paginate($perPage)->withQueryString();

        return LedgerEntryResource::collection($paginator);
    }

    /**
     * Tổng hợp thu / hoàn (quỹ) và cọc đang giữ
     *
     * @queryParam filter[property_id] uuid Lọc theo tòa (meta.property_id trên ledger; contract.property_id cho cọc).
     * @queryParam filter[occurred_between] string Khoảng thời gian ledger (Y-m-d,Y-m-d). Cọc không lọc theo ngày.
     */
    public function summary(Request $request)
    {
        $this->authorize('viewLedger', Payment::class);

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $occurredBetween = $request->input('filter.occurred_between');
        $propertyId = $request->input('filter.property_id');

        $data = $this->service->getFinancialSummary(
            $orgId,
            is_string($propertyId) ? $propertyId : null,
            is_string($occurredBetween) ? $occurredBetween : null,
        );

        return response()->json(['data' => $data]);
    }

    /**
     * Số dư tổng hợp sổ cái
     *
     * Trả về tổng debit, credit và số dư ròng của tổ chức (kế toán kép — không dùng làm thu/hoàn/lợi nhuận).
     */
    public function balance(Request $request)
    {
        $this->authorize('viewLedger', Payment::class);

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $balance = $this->service->getBalance($orgId);

        return response()->json(['data' => $balance]);
    }
}
