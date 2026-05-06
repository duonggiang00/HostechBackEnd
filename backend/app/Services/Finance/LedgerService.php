<?php

namespace App\Services\Finance;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Models\Contract\Contract;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\LedgerEntry;
use App\Models\Finance\Payment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Sổ cái kế toán kép: mỗi payment tạo 2 dòng (CASH_BANK debit, A/R credit).
 *
 * KPI tài chính (ledger/summary) — match thiết kế trang Sổ cái 5 tab:
 * - total_collected: tổng debit nhánh CASH_BANK, ref_type=payment (tiền vào quỹ từ thu hợp lệ).
 * - total_refunded: tổng `RefundReceipt.amount` đã chi (paid_at IS NOT NULL) — match tab "Tiền hoàn trả".
 * - total_deposit_held: tổng `deposit_amount` của hợp đồng đang ACTIVE (mỗi khi HĐ kết thúc tự động trừ).
 * - total_payment_reversal: (giữ tương thích) tổng credit nhánh CASH_BANK, ref_type=payment_reversal.
 */
class LedgerService
{
    /**
     * Ghi bút toán sổ cái khi có giao dịch thu tiền (Payment).
     *
     * Theo nguyên tắc kế toán kép:
     * - DEBIT: Tiền mặt / Ngân hàng tăng (tài sản tăng)
     * - CREDIT: Công nợ phải thu giảm (nợ giảm)
     */
    public function recordPayment(Payment $payment): array
    {
        return DB::transaction(function () use ($payment) {
            $existing = LedgerEntry::query()
                ->where('ref_type', 'payment')
                ->where('ref_id', $payment->id)
                ->lockForUpdate()
                ->orderBy('created_at')
                ->get();

            if ($existing->count() >= 2) {
                Log::warning('[Finance][Ledger] Duplicate RecordPaymentLedger delivery skipped (payment already posted)', [
                    'payment_id' => $payment->id,
                    'ledger_rows' => $existing->count(),
                ]);

                return [$existing[0], $existing[1]];
            }

            // Enrich meta với thông tin payer và hóa đơn liên quan
            $payment->loadMissing('payer', 'allocations.invoice');
            $payerName = $payment->payer?->full_name ?? null;
            $invoices = $payment->allocations->map(fn ($a) => $a->invoice)->filter();
            $invoiceIds = $invoices->pluck('id')->values()->toArray();
            $billingPeriods = $invoices->map(fn ($inv) => $this->formatInvoicePeriod($inv))->filter()->values()->toArray();
            $description = $this->buildPaymentDescription($payerName, $invoices);

            $sharedMeta = [
                'method' => $payment->method,
                'reference' => $payment->reference,
                'property_id' => $payment->property_id,
                'payer_name' => $payerName,
                'description' => $description,
                'invoice_ids' => $invoiceIds,
                'billing_periods' => $billingPeriods,
            ];

            $debitEntry = LedgerEntry::create([
                'org_id' => $payment->org_id,
                'ref_type' => 'payment',
                'ref_id' => $payment->id,
                'debit' => $payment->amount,
                'credit' => 0.00,
                'occurred_at' => $payment->received_at ?? now(),
                'meta' => array_merge($sharedMeta, ['account' => LedgerEntry::ACCOUNT_CASH_BANK]),
            ]);

            $creditEntry = LedgerEntry::create([
                'org_id' => $payment->org_id,
                'ref_type' => 'payment',
                'ref_id' => $payment->id,
                'debit' => 0.00,
                'credit' => $payment->amount,
                'occurred_at' => $payment->received_at ?? now(),
                'meta' => array_merge($sharedMeta, ['account' => LedgerEntry::ACCOUNT_ACCOUNTS_RECEIVABLE]),
            ]);

            return [$debitEntry, $creditEntry];
        });
    }

    /**
     * Tạo chuỗi diễn giải cho bút toán thanh toán.
     */
    private function buildPaymentDescription(?string $payerName, \Illuminate\Support\Collection $invoices): string
    {
        $name = $payerName ?? 'Khách';
        if ($invoices->isEmpty()) {
            return "Khách {$name} thanh toán";
        }
        if ($invoices->count() === 1) {
            $period = $this->formatInvoicePeriod($invoices->first());
            return $period
                ? "Khách {$name} thanh toán hóa đơn kỳ {$period}"
                : "Khách {$name} thanh toán hóa đơn";
        }

        return "Khách {$name} thanh toán {$invoices->count()} hóa đơn";
    }

    /**
     * Định dạng kỳ hóa đơn thành chuỗi "tháng M/YYYY" từ period_start.
     */
    private function formatInvoicePeriod(mixed $invoice): ?string
    {
        if (! $invoice || ! $invoice->period_start) {
            return null;
        }
        try {
            return 'tháng '.Carbon::parse($invoice->period_start)->format('m/Y');
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * Ghi nhận vào sổ kế toán: phần cọc còn lại bị thu hồi sau quyết toán thanh lý (không phát hành biên lai hoàn).
     *
     * Tiền cọc khi thu ban đầu không tạo dòng này; chỉ khi FORFEIT phần dư sau FIFO mới sinh bút ghi nhận.
     * Một dòng debit (không phải CASH_BANK) — không hợp nhất vào KPI “tiền vào quỹ” của cashflow-feed.
     */
    public function recordTerminationDepositForfeit(Contract $contract, float $amount, ?string $finalInvoiceId = null): ?LedgerEntry
    {
        if ($amount <= 0.02) {
            return null;
        }

        return DB::transaction(function () use ($contract, $amount, $finalInvoiceId) {
            $q = LedgerEntry::query()
                ->where('org_id', $contract->org_id)
                ->where('ref_type', LedgerEntry::REF_TYPE_TERMINATION_DEPOSIT_FORFEIT)
                ->where('meta->contract_id', $contract->id)
                ->lockForUpdate();

            if ($finalInvoiceId) {
                $q->where('meta->final_invoice_id', $finalInvoiceId);
            } else {
                $q->whereNull('meta->final_invoice_id');
            }

            if ($existing = $q->first()) {
                return $existing;
            }

            $contract->loadMissing('property', 'primaryMember');
            $tenantName = $contract->primaryMember?->full_name ?? null;
            $description = $tenantName
                ? "Thu hồi tiền cọc còn lại của khách {$tenantName} sau quyết toán thanh lý."
                : 'Ghi nhận sổ: thu hồi phần tiền cọc còn lại sau quyết toán thanh lý (không hoàn cho khách).';

            return LedgerEntry::create([
                'org_id' => $contract->org_id,
                'ref_type' => LedgerEntry::REF_TYPE_TERMINATION_DEPOSIT_FORFEIT,
                'ref_id' => (string) Str::uuid(),
                'debit' => round($amount, 2),
                'credit' => 0.00,
                'occurred_at' => now(),
                'meta' => [
                    'account' => 'DEPOSIT_FORFEIT_BOOK',
                    'property_id' => $contract->property_id,
                    'contract_id' => $contract->id,
                    'final_invoice_id' => $finalInvoiceId,
                    'reference' => 'THU-HOI-COC-'.strtoupper(substr((string) $contract->id, 0, 8)),
                    'tenant_name' => $tenantName,
                    'description' => $description,
                ],
            ]);
        });
    }

    /**
     * Ghi bút toán đảo ngược khi hủy Payment.
     *
     * Đảo ngược bút toán gốc:
     * - DEBIT: Công nợ phải thu (Nợ tăng lại)
     * - CREDIT: Tiền mặt (Tài sản giảm lại)
     */
    public function reversePayment(Payment $payment): array
    {
        return DB::transaction(function () use ($payment) {
            $existing = LedgerEntry::query()
                ->where('ref_type', 'payment_reversal')
                ->where('ref_id', $payment->id)
                ->lockForUpdate()
                ->orderBy('created_at')
                ->get();

            if ($existing->count() >= 2) {
                Log::warning('[Finance][Ledger] Duplicate reversePayment delivery skipped (reversal already posted)', [
                    'payment_id' => $payment->id,
                    'ledger_rows' => $existing->count(),
                ]);

                return [$existing[0], $existing[1]];
            }

            $payment->loadMissing('payer');
            $payerName = $payment->payer?->full_name ?? null;
            $description = $payerName
                ? "Đảo ngược thanh toán của khách {$payerName}"
                : 'Đảo ngược thanh toán (payment voided)';

            $sharedMeta = [
                'property_id' => $payment->property_id,
                'original_received_at' => $payment->received_at,
                'payer_name' => $payerName,
                'description' => $description,
            ];

            $debitEntry = LedgerEntry::create([
                'org_id' => $payment->org_id,
                'ref_type' => 'payment_reversal',
                'ref_id' => $payment->id,
                'debit' => $payment->amount,
                'credit' => 0.00,
                'occurred_at' => now(),
                'meta' => array_merge($sharedMeta, ['account' => LedgerEntry::ACCOUNT_ACCOUNTS_RECEIVABLE]),
            ]);

            $creditEntry = LedgerEntry::create([
                'org_id' => $payment->org_id,
                'ref_type' => 'payment_reversal',
                'ref_id' => $payment->id,
                'debit' => 0.00,
                'credit' => $payment->amount,
                'occurred_at' => now(),
                'meta' => array_merge($sharedMeta, ['account' => LedgerEntry::ACCOUNT_CASH_BANK]),
            ]);

            return [$debitEntry, $creditEntry];
        });
    }

    /**
     * Lấy lịch sử sổ cái theo ref_type và ref_id.
     */
    public function getByRef(string $refType, string $refId)
    {
        return LedgerEntry::where('ref_type', $refType)
            ->where('ref_id', $refId)
            ->orderBy('occurred_at', 'desc')
            ->get();
    }

    /**
     * Tổng hợp số dư sổ cái theo org (tổng debit/credit mọi dòng — kế toán kép, không dùng làm thu/hoàn/lợi nhuận).
     * KPI thu/hoàn/cọc: dùng {@see self::getFinancialSummary()}.
     */
    public function getBalance(string $orgId): array
    {
        $result = LedgerEntry::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->first();

        $totalDebit = (float) ($result->total_debit ?? 0);
        $totalCredit = (float) ($result->total_credit ?? 0);

        return [
            'total_debit' => $totalDebit,
            'total_credit' => $totalCredit,
            'net_balance' => $totalDebit - $totalCredit,
        ];
    }

    /**
     * Tổng hợp thu / hoàn (quỹ) + cọc đang giữ (hợp đồng).
     *
     * @param  string|null  $occurredBetween  "Y-m-d,Y-m-d" hoặc null
     */
    public function getFinancialSummary(
        string $orgId,
        ?string $propertyId = null,
        ?string $occurredBetween = null,
    ): array {
        $from = null;
        $to = null;
        if ($occurredBetween && str_contains($occurredBetween, ',')) {
            [$from, $to] = array_map('trim', explode(',', $occurredBetween, 2));
        }

        $totalCollected = (float) $this->ledgerCashKpiBaseQuery($orgId, $propertyId, $from, $to)
            ->where('ref_type', 'payment')
            ->sum('debit');

        // Giữ thông tin payment_reversal để tương thích nơi khác có thể cần (dashboards/audit).
        $totalPaymentReversal = (float) $this->ledgerCashKpiBaseQuery($orgId, $propertyId, $from, $to)
            ->where('ref_type', 'payment_reversal')
            ->sum('credit');

        $totalRefunded = $this->sumPaidRefundReceipts($orgId, $propertyId, $from, $to);

        $totalDepositHeld = $this->sumDepositOfActiveContracts($orgId, $propertyId);

        return [
            'total_collected' => $totalCollected,
            'total_refunded' => $totalRefunded,
            'total_payment_reversal' => $totalPaymentReversal,
            'total_deposit_held' => $totalDepositHeld,
            'period' => [
                'from' => $from,
                'to' => $to,
            ],
            'property_id' => $propertyId ?: null,
        ];
    }

    /**
     * Tổng RefundReceipt đã chi (paid_at != null) — match tab "Tiền hoàn trả".
     */
    public function sumPaidRefundReceipts(
        string $orgId,
        ?string $propertyId = null,
        ?string $from = null,
        ?string $to = null,
    ): float {
        $q = RefundReceipt::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->whereNotNull('paid_at');

        if ($propertyId !== null && $propertyId !== '') {
            $q->whereHas('contract', fn ($c) => $c->where('property_id', $propertyId));
        }
        if ($from) {
            $q->where('paid_at', '>=', $from.' 00:00:00');
        }
        if ($to) {
            $q->where('paid_at', '<=', $to.' 23:59:59');
        }

        return (float) $q->sum('amount');
    }

    /**
     * Tổng tiền cọc đang giữ — chỉ tính HĐ ACTIVE (kết thúc HĐ → không còn trong sum).
     */
    public function sumDepositOfActiveContracts(string $orgId, ?string $propertyId = null): float
    {
        $q = Contract::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->where('status', ContractStatus::ACTIVE->value)
            ->where('deposit_amount', '>', 0);

        if ($propertyId !== null && $propertyId !== '') {
            $q->where('property_id', $propertyId);
        }

        return (float) $q->sum('deposit_amount');
    }

    /**
     * Cọc còn nằm về phía chủ (chưa hoàn hết cho khách theo số dư deposit − refunded).
     */
    public function sumDepositHeldRemaining(string $orgId, ?string $propertyId = null): float
    {
        $statuses = [
            DepositStatus::HELD,
            DepositStatus::REFUND_PENDING,
            DepositStatus::PARTIAL_REFUND,
            DepositStatus::FORFEITED,
        ];

        $q = Contract::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->whereIn('deposit_status', array_map(fn (DepositStatus $s) => $s->value, $statuses));

        if ($propertyId !== null && $propertyId !== '') {
            $q->where('property_id', $propertyId);
        }

        $sumExpr = 'COALESCE(SUM(GREATEST(0, deposit_amount - COALESCE(refunded_amount, 0))), 0)';

        return (float) $q->clone()->selectRaw($sumExpr.' as aggregate')->value('aggregate');
    }

    /**
     * @param  string|null  $from  Y-m-d
     * @param  string|null  $to  Y-m-d
     */
    protected function ledgerCashKpiBaseQuery(
        string $orgId,
        ?string $propertyId,
        ?string $from,
        ?string $to,
    ): Builder {
        $q = LedgerEntry::withoutGlobalScope('org_id')
            ->where('org_id', $orgId)
            ->forLedgerCashKpis();

        if ($propertyId !== null && $propertyId !== '') {
            $q->where('meta->property_id', $propertyId);
        }
        if ($from) {
            $q->where('occurred_at', '>=', $from.' 00:00:00');
        }
        if ($to) {
            $q->where('occurred_at', '<=', $to.' 23:59:59');
        }

        return $q;
    }
}
