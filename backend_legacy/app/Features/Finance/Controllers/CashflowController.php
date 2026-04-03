<?php

namespace App\Features\Finance\Controllers;

use App\Features\Finance\Models\LedgerEntry;
use App\Features\Finance\Models\Payment;
use App\Http\Controllers\Controller;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Phân hệ Dòng tiền (Cashflow)
 *
 * API báo cáo và ghi nhận dòng tiền thực tế In/Out.
 * Dòng tiền được tổng hợp từ LedgerEntry (debit = IN, credit = OUT).
 */
#[Group('Tài chính – Dòng tiền')]
class CashflowController extends Controller
{
    /**
     * Báo cáo dòng tiền In/Out
     *
     * Tổng hợp dòng tiền thực tế theo khoảng thời gian.
     * Dữ liệu được tổng hợp từ LedgerEntry của org.
     *
     * @queryParam from string Từ ngày (YYYY-MM-DD). Example: 2024-03-01
     * @queryParam to string Đến ngày (YYYY-MM-DD). Example: 2024-03-31
     * @queryParam per_page int Số bản ghi mỗi trang. Example: 15
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewLedger', Payment::class);

        $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to'   => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $user  = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id', $user->org_id) : $user->org_id;

        $query = LedgerEntry::where('org_id', $orgId);

        if ($request->filled('from')) {
            $query->where('occurred_at', '>=', $request->input('from').' 00:00:00');
        }
        if ($request->filled('to')) {
            $query->where('occurred_at', '<=', $request->input('to').' 23:59:59');
        }

        // Tổng hợp dòng tiền
        $summary = $query->selectRaw('
            SUM(debit)  as total_in,
            SUM(credit) as total_out,
            SUM(debit) - SUM(credit) as net_cashflow,
            COUNT(*) as entry_count
        ')->first();

        // Chi tiết dòng tiền phân theo ngày
        $perPage = min((int) $request->input('per_page', 30), 100);

        $dailyQuery = LedgerEntry::where('org_id', $orgId)
            ->selectRaw('
                DATE(occurred_at) as date,
                SUM(debit)  as total_in,
                SUM(credit) as total_out,
                SUM(debit) - SUM(credit) as net
            ')
            ->groupByRaw('DATE(occurred_at)')
            ->orderBy('date', 'desc');

        if ($request->filled('from')) {
            $dailyQuery->where('occurred_at', '>=', $request->input('from').' 00:00:00');
        }
        if ($request->filled('to')) {
            $dailyQuery->where('occurred_at', '<=', $request->input('to').' 23:59:59');
        }

        $daily = $dailyQuery->paginate($perPage)->withQueryString();

        return response()->json([
            'data' => [
                'summary' => [
                    'total_in'     => (float) ($summary->total_in ?? 0),
                    'total_out'    => (float) ($summary->total_out ?? 0),
                    'net_cashflow' => (float) ($summary->net_cashflow ?? 0),
                    'entry_count'  => (int) ($summary->entry_count ?? 0),
                    'period'       => [
                        'from' => $request->input('from'),
                        'to'   => $request->input('to'),
                    ],
                ],
                'daily' => $daily,
            ],
        ]);
    }

    /**
     * Ghi nhận khoản thu/chi ngoài hóa đơn
     *
     * Ghi nhận các khoản thu/chi không liên quan đến hóa đơn:
     * chi phí bảo trì đột xuất, thu dịch vụ phụ, chi khác...
     *
     * @bodyParam type string Required. Loại: IN (thu) hoặc OUT (chi). Example: OUT
     * @bodyParam amount decimal Required. Số tiền. Example: 2000000.00
     * @bodyParam reason string Required. Lý do/mô tả. Example: Chi phí sửa thang máy
     * @bodyParam occurred_at string Thời điểm phát sinh (ISO 8601). Example: 2024-03-16T10:00:00Z
     * @bodyParam meta object Thông tin phụ. Example: {"category": "maintenance"}
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Payment::class);

        $validated = $request->validate([
            'type'        => ['required', 'string', 'in:IN,OUT'],
            'amount'      => ['required', 'numeric', 'min:0.01'],
            'reason'      => ['required', 'string', 'max:500'],
            'occurred_at' => ['nullable', 'date'],
            'meta'        => ['nullable', 'array'],
        ]);

        $user  = $request->user();
        $orgId = $user->hasRole('Admin') ? $request->input('org_id', $user->org_id) : $user->org_id;

        // Ghi nhận vào LedgerEntry: IN = debit, OUT = credit
        $entry = LedgerEntry::create([
            'org_id'      => $orgId,
            'ref_type'    => 'cashflow_manual',
            'ref_id'      => $orgId, // Dùng org_id làm ref khi không liên quan invoice
            'debit'       => $validated['type'] === 'IN'  ? $validated['amount'] : 0,
            'credit'      => $validated['type'] === 'OUT' ? $validated['amount'] : 0,
            'occurred_at' => $validated['occurred_at'] ?? now(),
            'meta'        => array_merge($validated['meta'] ?? [], [
                'reason' => $validated['reason'],
                'type'   => $validated['type'],
                'recorded_by' => $user->id,
            ]),
        ]);

        return response()->json([
            'message' => 'Ghi nhận dòng tiền thành công.',
            'data'    => [
                'id'          => $entry->id,
                'type'        => $validated['type'],
                'amount'      => (float) $validated['amount'],
                'reason'      => $validated['reason'],
                'occurred_at' => $entry->occurred_at?->toIso8601String(),
                'created_at'  => $entry->created_at?->toIso8601String(),
            ],
        ], 201);
    }
}
