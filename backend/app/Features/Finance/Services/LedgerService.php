<?php

namespace App\Features\Finance\Services;

use App\Features\Finance\Models\LedgerEntry;
use App\Features\Finance\Models\Payment;

class LedgerService
{
    /**
     * Ghi bút toán sổ cái khi có giao dịch thu tiền (Payment).
     *
     * Theo nguyên tắc kế toán kép:
     * - DEBIT: Tiền mặt / Ngân hàng tăng (tài sản tăng)
     * - CREDIT: Công nợ phải thu giảm (nợ giảm)
     */
    public function recordPayment(Payment $payment): LedgerEntry
    {
        return LedgerEntry::create([
            'org_id'      => $payment->org_id,
            'ref_type'    => 'payment',
            'ref_id'      => $payment->id,
            'debit'       => $payment->amount,
            'credit'      => 0.00,
            'occurred_at' => $payment->received_at ?? now(),
            'meta'        => [
                'method'    => $payment->method,
                'reference' => $payment->reference,
                'property_id' => $payment->property_id,
            ],
        ]);
    }

    /**
     * Ghi bút toán đảo ngược khi hủy Payment.
     *
     * DEBIT: 0, CREDIT: amount (đảo ngược bút toán gốc).
     */
    public function reversePayment(Payment $payment): LedgerEntry
    {
        return LedgerEntry::create([
            'org_id'      => $payment->org_id,
            'ref_type'    => 'payment_reversal',
            'ref_id'      => $payment->id,
            'debit'       => 0.00,
            'credit'      => $payment->amount,
            'occurred_at' => now(),
            'meta'        => [
                'reason' => 'Payment voided',
                'original_received_at' => $payment->received_at,
            ],
        ]);
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
     * Tổng hợp số dư sổ cái theo org.
     */
    public function getBalance(string $orgId): array
    {
        $result = LedgerEntry::where('org_id', $orgId)
            ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
            ->first();

        $totalDebit  = (float) ($result->total_debit ?? 0);
        $totalCredit = (float) ($result->total_credit ?? 0);

        return [
            'total_debit'  => $totalDebit,
            'total_credit' => $totalCredit,
            'net_balance'  => $totalDebit - $totalCredit,
        ];
    }
}
