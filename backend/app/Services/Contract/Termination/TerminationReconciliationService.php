<?php

namespace App\Services\Contract\Termination;

use App\Enums\ContractStatus;
use App\Enums\DepositStatus;
use App\Events\Contract\Termination\SettlementPaymentRequired;
use App\Events\Contract\Termination\SettlementResolved;
use App\Models\Contract\Contract;
use App\Models\Contract\FinalPaymentRequest;
use App\Models\Contract\RefundReceipt;
use App\Models\Finance\LedgerEntry;
use App\Models\Invoice\Invoice;
use App\Services\Contract\ContractService;
use App\Services\Invoice\InvoiceService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TerminationReconciliationService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected ContractService $contractService,
    ) {}

    /**
     * Xem trước quyết toán: công thức Số dư = Tiền cọc − (Nợ hóa đơn cũ + Hóa đơn thanh lý cuối).
     *
     * @param  array<string, mixed>  $terminatePayload
     * @return array<string, mixed>
     */
    public function preview(Contract $contract, string $terminationDate, array $terminatePayload = []): array
    {
        $penalty = $this->contractService->resolveTerminationPipelinePenalty($contract, $terminatePayload);
        $items = $this->contractService->buildTerminationPipelineInvoiceItems(
            $contract,
            $terminationDate,
            array_merge($terminatePayload, ['penalty_amount' => $penalty['penalty_amount']])
        );
        $finalTotal = (float) collect($items)->sum('amount');

        $depositCredit = (float) $contract->deposit_amount;
        $oldDebts = $this->fifoOutstandingInvoices($contract, null)->map(function (Invoice $inv) {
            return [
                'invoice_id' => $inv->id,
                'period_start' => $inv->period_start?->toDateString(),
                'outstanding' => $this->outstanding($inv),
            ];
        })->values()->all();

        $oldDebtTotal = (float) collect($oldDebts)->sum('outstanding');
        $balance = round($depositCredit - $oldDebtTotal - $finalTotal, 2);

        $scenario = match (true) {
            $balance > 0.009 => 'A',
            $balance < -0.009 => 'B',
            default => 'C',
        };

        return [
            'tong_tien_coc' => $depositCredit,
            'no_cu' => $oldDebts,
            'tong_no_cu' => $oldDebtTotal,
            'phi_thanh_ly_cuoi' => $finalTotal,
            'so_du_sau_quyet_toan' => $balance,
            'kich_ban' => $scenario,
            'hoan_tra_du_kien' => $balance > 0.009 ? $balance : 0.0,
            'con_phai_thu' => $balance < -0.009 ? abs($balance) : 0.0,
        ];
    }

    /**
     * FIFO: hóa đơn cũ trước, hóa đơn thanh lý sau — không sửa/xóa bản ghi tiền cọc trên hợp đồng (chỉ dùng như hạn mức credit).
     *
     * @return array<string, mixed>
     */
    public function reconcile(Contract $contract, Invoice $finalInvoice): array
    {
        return DB::transaction(function () use ($contract, $finalInvoice) {
            $creditRemaining = round((float) $contract->deposit_amount, 2);
            $finalInvoice->refresh();
            $contract->refresh();

            foreach ($this->fifoOutstandingInvoices($contract, $finalInvoice->id) as $invoice) {
                if ($creditRemaining <= 0) {
                    break;
                }
                $outstanding = $this->outstanding($invoice);
                if ($outstanding <= 0) {
                    continue;
                }
                $creditBefore = $creditRemaining;
                $creditRemaining = $this->invoiceService->applyDepositCreditTowardInvoice(
                    $invoice,
                    $creditRemaining,
                    'Cấn trừ từ tiền cọc (FIFO — hóa đơn cũ).'
                );
                $this->recordDepositLedger($contract, $invoice, round($creditBefore - $creditRemaining, 2));
            }

            if ($creditRemaining > 0) {
                $creditBefore = $creditRemaining;
                $creditRemaining = $this->invoiceService->applyDepositCreditTowardInvoice(
                    $finalInvoice->fresh(),
                    $creditRemaining,
                    'Cấn trừ từ tiền cọc (hóa đơn thanh lý cuối).'
                );
                $this->recordDepositLedger($contract, $finalInvoice->fresh(), round($creditBefore - $creditRemaining, 2));
            }

            $finalOutstanding = $this->outstanding($finalInvoice->fresh());

            if ($finalOutstanding > 0.02) {
                $fpr = FinalPaymentRequest::create([
                    'org_id' => $contract->org_id,
                    'contract_id' => $contract->id,
                    'invoice_id' => $finalInvoice->id,
                    'amount_due' => $finalOutstanding,
                    'status' => 'PENDING',
                    'meta' => ['source' => 'termination_eda'],
                ]);

                $contract->update([
                    'status' => ContractStatus::PENDING_SETTLEMENT,
                    'meta' => array_merge($contract->meta ?? [], [
                        'termination_settlement' => [
                            'scenario' => 'B',
                            'final_payment_request_id' => $fpr->id,
                            'amount_due' => (string) $finalOutstanding,
                        ],
                    ]),
                ]);

                event(new SettlementPaymentRequired($contract->fresh(), $fpr));

                return [
                    'scenario' => 'B',
                    'final_payment_request_id' => $fpr->id,
                    'amount_due' => $finalOutstanding,
                ];
            }

            $refundReceiptId = null;
            $scenario = 'C';
            if ($creditRemaining > 0.02) {
                $scenario = 'A';
                $receipt = RefundReceipt::create([
                    'org_id' => $contract->org_id,
                    'contract_id' => $contract->id,
                    'amount' => $creditRemaining,
                    'meta' => ['note' => 'Hoàn trả phần cọc sau khi trừ hết nợ (FIFO).'],
                ]);
                $refundReceiptId = $receipt->id;
                $contract->update([
                    'refunded_amount' => $creditRemaining,
                    'deposit_status' => DepositStatus::REFUND_PENDING,
                    'meta' => array_merge($contract->meta ?? [], [
                        'termination_settlement' => [
                            'scenario' => 'A',
                            'refund_receipt_id' => $refundReceiptId,
                            'refund_amount' => (string) $creditRemaining,
                        ],
                    ]),
                ]);
            } else {
                $contract->update([
                    'deposit_status' => DepositStatus::HELD,
                    'meta' => array_merge($contract->meta ?? [], [
                        'termination_settlement' => [
                            'scenario' => 'C',
                        ],
                    ]),
                ]);
            }

            event(new SettlementResolved($contract->fresh(), $finalInvoice->fresh(), $refundReceiptId));

            return [
                'scenario' => $scenario,
                'refund_receipt_id' => $refundReceiptId,
                'refund_amount' => $creditRemaining > 0.02 ? $creditRemaining : 0.0,
            ];
        });
    }

    /**
     * @return Collection<int, Invoice>
     */
    protected function fifoOutstandingInvoices(Contract $contract, ?string $excludeInvoiceId)
    {
        $q = Invoice::query()
            ->where('contract_id', $contract->id)
            ->where('is_termination', false)
            ->whereIn('status', ['ISSUED', 'LATE', 'PARTIAL', 'OVERDUE'])
            ->orderBy('period_start')
            ->orderBy('due_date')
            ->orderBy('created_at');

        if ($excludeInvoiceId) {
            $q->where('id', '!=', $excludeInvoiceId);
        }

        return $q->get()->filter(fn (Invoice $inv) => $this->outstanding($inv) > 0.009)->values();
    }

    protected function outstanding(Invoice $invoice): float
    {
        return round(max(0, (float) $invoice->total_amount - (float) $invoice->paid_amount), 2);
    }

    protected function recordDepositLedger(Contract $contract, Invoice $invoice, float $amount): void
    {
        if ($amount <= 0) {
            return;
        }

        LedgerEntry::create([
            'org_id' => $contract->org_id,
            'ref_type' => 'termination_deposit_allocation',
            'ref_id' => $contract->id,
            'debit' => 0,
            'credit' => $amount,
            'occurred_at' => now(),
            'meta' => [
                'invoice_id' => $invoice->id,
                'contract_id' => $contract->id,
            ],
        ]);
    }
}
