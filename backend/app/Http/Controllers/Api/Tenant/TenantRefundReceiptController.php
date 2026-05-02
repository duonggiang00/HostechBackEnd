<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Finance\RefundReceiptResource;
use App\Models\Contract\Contract;
use App\Models\Contract\RefundReceipt;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * Tenant — biên lai hoàn cọc
 *
 * Khách thuê chỉ thấy phiếu hoàn cọc của các hợp đồng mình là thành viên,
 * và chỉ những phiếu đã được BQL đánh dấu đã chi (có `paid_at` + `pdf_path`).
 */
#[Group('Tenant — Hoàn cọc')]
class TenantRefundReceiptController extends Controller
{
    /**
     * Danh sách phiếu hoàn cọc của Tenant.
     *
     * @queryParam per_page int Default 15. Example: 10
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $contractIds = Contract::query()
            ->whereHas('members', fn ($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        $query = RefundReceipt::query()
            ->whereIn('contract_id', $contractIds)
            ->whereNotNull('paid_at')
            ->whereNotNull('pdf_path')
            ->with(['contract.property', 'contract.room', 'paidBy'])
            ->orderByDesc('paid_at');

        return RefundReceiptResource::collection($query->paginate($perPage)->withQueryString());
    }

    /**
     * Chi tiết phiếu hoàn cọc (kèm `pdf_url`).
     */
    public function show(Request $request, string $id): RefundReceiptResource
    {
        $user = $request->user();

        $receipt = RefundReceipt::query()
            ->whereHas('contract.members', fn ($q) => $q->where('user_id', $user->id))
            ->with(['contract.property', 'contract.room', 'paidBy'])
            ->findOrFail($id);

        abort_if(! $receipt->isPaid() || ! $receipt->pdf_path, 404, 'Phiếu hoàn cọc chưa sẵn sàng.');

        return new RefundReceiptResource($receipt);
    }
}
