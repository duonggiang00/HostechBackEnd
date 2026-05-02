<?php

namespace App\Http\Controllers\Api\Finance;

use App\Enums\DepositStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\RefundReceiptResource;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\Payment;
use App\Services\Finance\ReceiptService;
use App\Services\TenantManager;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

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
     * @queryParam filter[contract_id] uuid Lọc theo hợp đồng.
     * @queryParam filter[created_between] string Y-m-d,Y-m-d theo created_at của phiếu.
     * @queryParam filter[paid_only] bool 1 = chỉ phiếu đã chi (paid_at != null), sort theo paid_at desc.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewLedger', Payment::class);

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'filter.property_id' => ['nullable', 'uuid'],
            'filter.contract_id' => ['nullable', 'uuid'],
            'filter.created_between' => ['nullable', 'string'],
            'filter.paid_only' => ['nullable', 'boolean'],
        ]);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org). Hãy mở trong phạm vi tòa/organization hoặc gửi header X-Org-Id.');

        $query = RefundReceipt::query()
            ->where('org_id', $orgId)
            ->with(['contract.property', 'contract.room', 'contract.primaryMember.user', 'paidBy']);

        if ($request->filled('filter.property_id')) {
            $propertyId = $request->input('filter.property_id');
            $query->whereHas('contract', fn ($q) => $q->where('property_id', $propertyId));
        }

        if ($request->filled('filter.contract_id')) {
            $query->where('contract_id', $request->input('filter.contract_id'));
        }

        $createdBetween = $request->input('filter.created_between');
        if ($createdBetween && str_contains((string) $createdBetween, ',')) {
            [$from, $to] = explode(',', (string) $createdBetween, 2);
            $query->whereBetween('created_at', [trim($from).' 00:00:00', trim($to).' 23:59:59']);
        }

        $paidOnly = filter_var($request->input('filter.paid_only'), FILTER_VALIDATE_BOOLEAN);
        if ($paidOnly) {
            $query->whereNotNull('paid_at')->orderByDesc('paid_at');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return RefundReceiptResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Chi tiết một phiếu hoàn cọc (kèm `pdf_url` nếu đã sinh).
     */
    public function show(Request $request, string $id): RefundReceiptResource
    {
        $this->authorize('viewLedger', Payment::class);

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org).');

        $receipt = RefundReceipt::where('org_id', $orgId)
            ->with(['contract.property', 'contract.room', 'contract.primaryMember.user', 'paidBy'])
            ->findOrFail($id);

        return new RefundReceiptResource($receipt);
    }

    /**
     * Xác nhận đã chi hoàn cọc cho khách → cập nhật contract.deposit_status = REFUNDED, sinh bản mềm PDF.
     *
     * @bodyParam paid_at         date    Ngày chi tiền (mặc định now). Example: 2026-05-02
     * @bodyParam payout_method   string  required CASH | TRANSFER. Example: TRANSFER
     * @bodyParam payout_reference string Số tham chiếu chuyển khoản (tuỳ chọn). Example: VCB-123456
     */
    public function markPaid(Request $request, string $id, ReceiptService $receiptService): RefundReceiptResource
    {
        $this->authorize('viewLedger', Payment::class);

        $orgId = $this->resolveLedgerOrgId($request);
        abort_if(! $orgId, 422, 'Không xác định được tổ chức (org).');

        $validated = $request->validate([
            'paid_at' => ['nullable', 'date'],
            'payout_method' => ['required', 'string', 'in:CASH,TRANSFER'],
            'payout_reference' => ['nullable', 'string', 'max:100'],
        ]);

        $lock = Cache::lock('refund_receipt.mark_paid.'.$id, 30);
        abort_if(! $lock->get(), 409, 'Phiếu đang được xử lý. Thử lại sau ít giây.');

        try {
            $receipt = DB::transaction(function () use ($id, $orgId, $validated, $request, $receiptService) {
                $receipt = RefundReceipt::where('org_id', $orgId)
                    ->lockForUpdate()
                    ->findOrFail($id);

                if ($receipt->isPaid() && $receipt->pdf_path) {
                    return $receipt->load([
                        'contract.property',
                        'contract.room',
                        'paidBy',
                    ]);
                }

                $receipt->forceFill([
                    'paid_at' => $validated['paid_at'] ?? now(),
                    'paid_by_user_id' => $request->user()->id,
                    'payout_method' => $validated['payout_method'],
                    'payout_reference' => $validated['payout_reference'] ?? null,
                ])->save();

                $contract = $receipt->contract()->lockForUpdate()->first();
                if ($contract) {
                    $contract->forceFill([
                        'deposit_status' => DepositStatus::REFUNDED,
                        'refunded_amount' => (float) $receipt->amount,
                    ])->save();
                }

                $receipt->load(['contract.property', 'contract.room', 'paidBy']);

                return $receiptService->generateForRefundReceipt($receipt);
            });
        } finally {
            $lock->release();
        }

        return new RefundReceiptResource(
            $receipt->load(['contract.property', 'contract.room', 'paidBy'])
        );
    }
}
