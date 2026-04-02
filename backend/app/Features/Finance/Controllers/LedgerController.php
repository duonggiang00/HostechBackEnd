<?php

namespace App\Features\Finance\Controllers;

use App\Features\Finance\Models\LedgerEntry;
use App\Features\Finance\Models\Payment;
use App\Http\Controllers\Controller;
use App\Features\Finance\Resources\LedgerEntryResource;
use App\Features\Finance\Services\LedgerService;
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
     * Lịch sử bút toán sổ cái
     *
     * Truy vấn danh sách các bút toán sổ cái. Hỗ trợ lọc theo loại tham chiếu,
     * ID tham chiếu, khoảng thời gian.
     *
     * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
     * @queryParam filter[ref_type] string Loại tham chiếu: payment, payment_reversal. Example: payment
     * @queryParam filter[ref_id] uuid ID tham chiếu (UUID của payment). Example: uuid
     * @queryParam filter[occurred_between] string Khoảng thời gian (phân cách dấu phẩy). Example: 2024-03-01,2024-03-31
     * @queryParam sort string Sắp xếp. Example: -occurred_at
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewLedger', Payment::class);

        $perPage = (int) $request->input('per_page', 15);
        if ($perPage < 1 || $perPage > 100) {
            $perPage = 15;
        }

        $user = $request->user();
        $query = LedgerEntry::query()->orderBy('occurred_at', 'desc');

        // Scoping theo org
        if (! $user->hasRole('Admin')) {
            $query->where('org_id', $user->org_id);
        } elseif ($request->input('org_id')) {
            $query->where('org_id', $request->input('org_id'));
        }

        // Filters
        if ($request->filled('filter.ref_type')) {
            $query->where('ref_type', $request->input('filter.ref_type'));
        }
        if ($request->filled('filter.ref_id')) {
            $query->where('ref_id', $request->input('filter.ref_id'));
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
     * Số dư tổng hợp sổ cái
     *
     * Trả về tổng debit, credit và số dư ròng của tổ chức.
     */
    public function balance(Request $request)
    {
        $this->authorize('viewLedger', Payment::class);

        $user = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id', $user->org_id) : $user->org_id;

        $balance = $this->service->getBalance($orgId);

        return response()->json(['data' => $balance]);
    }
}
