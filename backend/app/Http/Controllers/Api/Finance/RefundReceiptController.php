<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\RefundReceiptResource;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\Payment;
use App\Services\TenantManager;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

#[Group('Tài chính – Hoàn cọc')]
class RefundReceiptController extends Controller
{
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
     * Danh sách phiếu hoàn cọc (sau thanh lý hợp đồng).
     *
     * @queryParam per_page int Example: 15
     * @queryParam filter[property_id] uuid Lọc theo tòa (contracts.property_id).
     * @queryParam filter[created_between] string Y-m-d,Y-m-d theo created_at của phiếu.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewLedger', Payment::class);

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.created_between' => ['nullable', 'string'],
        ]);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $query = RefundReceipt::query()
            ->where('org_id', $orgId)
            ->with(['contract.property', 'contract.room']);

        if ($request->filled('filter.property_id')) {
            $propertyId = $request->input('filter.property_id');
            $query->whereHas('contract', fn ($q) => $q->where('property_id', $propertyId));
        }

        $createdBetween = $request->input('filter.created_between');
        if ($createdBetween && str_contains((string) $createdBetween, ',')) {
            [$from, $to] = explode(',', (string) $createdBetween, 2);
            $query->whereBetween('created_at', [trim($from).' 00:00:00', trim($to).' 23:59:59']);
        }

        $query->orderBy('created_at', 'desc');

        return RefundReceiptResource::collection($query->paginate($perPage)->withQueryString());
    }
}
