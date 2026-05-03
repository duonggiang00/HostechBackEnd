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
use App\Models\Org\Org;
use App\Models\Org\User;
use App\Services\Contract\ContractService;
use App\Services\Finance\LedgerService;
use App\Services\Invoice\InvoiceAdjustmentService;
use App\Services\Invoice\InvoiceService;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TerminationReconciliationService
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected ContractService $contractService,
        protected InvoiceAdjustmentService $invoiceAdjustmentService,
        protected LedgerService $ledgerService,
    ) {}

    /**
     * Xem trước quyết toán: công thức Số dư = Tiền cọc − (Nợ hóa đơn cũ + Hóa đơn thanh lý cuối).
     *
     * @param  array<string, mixed>  $terminatePayload
     * @return array<string, mixed>
     */
    public function preview(Contract $contract, string $terminationDate, array $terminatePayload = []): array
    {
        $terminatePayload = array_merge($terminatePayload, ['termination_date' => $terminationDate]);

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

        $existingPeriodicInvoiceId = $this->findExistingMonthlyInvoiceId($contract, $terminationDate);

        $depositOnlyRefund = $balance > 0.009 ? $balance : 0.0;

        $contract->loadMissing('org');

        return [
            'tong_tien_coc' => $depositCredit,
            'no_cu' => $oldDebts,
            'tong_no_cu' => $oldDebtTotal,
            'phi_thanh_ly_cuoi' => $finalTotal,
            'items' => $items,
            'so_du_sau_quyet_toan' => $balance,
            'kich_ban' => $scenario,
            'hoan_tra_du_kien' => $depositOnlyRefund,
            'hoan_tra_goodwill_du_kien' => 0.0,
            'tong_hoan_tra_du_kien' => round(max(0.0, $balance), 2),
            'con_phai_thu' => $balance < -0.009 ? abs($balance) : 0.0,
            'billing_mode' => ($terminatePayload['billing_mode'] ?? 'combined') === 'split' ? 'split' : 'combined',
            'existing_monthly_invoice_id' => $existingPeriodicInvoiceId,
            'is_early_termination' => $contract->isTerminationBeforeScheduledEnd($terminationDate),
            'preview_source' => 'pipeline_estimate',
            'termination_supplemental_invoice_for_outstanding_enabled' => (bool) $contract->org?->requiresTerminationSupplementalInvoiceForOutstanding(),
        ];
    }

    /**
     * Tìm hóa đơn định kỳ cùng tháng (calendar) của terminationDate (không phải HĐ thanh lý).
     */
    protected function findExistingMonthlyInvoiceId(Contract $contract, string $terminationDate): ?string
    {
        $start = Carbon::parse($terminationDate)->startOfMonth()->toDateString();
        $end = Carbon::parse($terminationDate)->endOfMonth()->toDateString();

        return Invoice::query()
            ->where('contract_id', $contract->id)
            ->where('is_termination', false)
            ->whereDate('period_start', $start)
            ->whereDate('period_end', $end)
            ->whereIn('status', ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'])
            ->orderByDesc('created_at')
            ->value('id');
    }

    /**
     * FIFO: hóa đơn cũ trước, hóa đơn thanh lý sau — không sửa/xóa bản ghi tiền cọc trên hợp đồng (chỉ dùng như hạn mức credit).
     *
     * @param  array<string, mixed>  $options  `refund_receipt_lines` — dòng hoàn do manager nhập (tổng không vượt cọc còn lại sau FIFO).
     * @return array<string, mixed>
     */
    public function reconcile(Contract $contract, Invoice $finalInvoice, array $options = []): array
    {
        return DB::transaction(function () use ($contract, $finalInvoice, $options) {
            $normalizedLines = $this->normalizeRefundReceiptLines($options['refund_receipt_lines'] ?? null);
            $useReceiptLines = $normalizedLines !== [];

            $creditRemaining = round((float) $contract->deposit_amount, 2);
            $finalInvoice->refresh();
            $contract->refresh();
            $contract->loadMissing('org');

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
                $D = round($finalOutstanding, 2);
                $org = $contract->org ?? Org::query()->find($contract->org_id);
                $useSupplementalInvoice = $org && $org->requiresTerminationSupplementalInvoiceForOutstanding();

                $fprInvoiceId = $finalInvoice->id;
                $supplementalInvoiceId = null;
                $fprMeta = ['source' => 'termination_eda'];

                if ($useSupplementalInvoice) {
                    $actingUser = $this->resolveActingUser($contract, $options);
                    [$periodStart, $periodEnd] = $this->allocateSupplementalInvoicePeriod($contract, $finalInvoice);

                    $supplemental = $this->invoiceService->create([
                        'org_id' => $finalInvoice->org_id,
                        'property_id' => $finalInvoice->property_id,
                        'room_id' => $finalInvoice->room_id,
                        'contract_id' => $contract->id,
                        'status' => 'ISSUED',
                        'due_date' => $finalInvoice->due_date?->toDateString() ?? now()->toDateString(),
                        'period_start' => $periodStart,
                        'period_end' => $periodEnd,
                        'is_termination' => false,
                        'paid_amount' => 0,
                        'created_by_user_id' => $actingUser->id,
                        'snapshot' => [
                            'source' => 'termination_supplemental_debt',
                            'termination_invoice_id' => $finalInvoice->id,
                            'contract_id' => $contract->id,
                        ],
                    ], [[
                        'type' => 'ADJUSTMENT',
                        'description' => 'Nợ quyết toán thanh lý (chứng từ bổ sung)',
                        'quantity' => 1,
                        'unit_price' => $D,
                        'amount' => $D,
                    ]]);

                    $supplementalInvoiceId = $supplemental->id;
                    $fprInvoiceId = $supplementalInvoiceId;

                    $terminationForAdj = $finalInvoice->fresh();
                    $adjustment = $this->invoiceAdjustmentService->createAdjustment($terminationForAdj, [
                        'type' => 'CREDIT',
                        'amount' => $D,
                        'reason' => 'Chuyển nợ quyết toán sang hóa đơn bổ sung '.$supplementalInvoiceId.'.',
                    ], $actingUser);
                    $this->invoiceAdjustmentService->approveAdjustment($adjustment, $actingUser);
                    $this->invoiceService->syncInvoicePaidAmountAfterTotalRecalc($terminationForAdj->fresh());

                    $fprMeta['termination_invoice_id'] = $finalInvoice->id;
                    $fprMeta['supplemental_invoice_id'] = $supplementalInvoiceId;
                }

                $fpr = FinalPaymentRequest::create([
                    'org_id' => $contract->org_id,
                    'contract_id' => $contract->id,
                    'invoice_id' => $fprInvoiceId,
                    'amount_due' => $D,
                    'status' => 'PENDING',
                    'meta' => $fprMeta,
                ]);

                $settlementMeta = [
                    'scenario' => 'B',
                    'final_payment_request_id' => $fpr->id,
                    'amount_due' => (string) $D,
                ];
                if ($supplementalInvoiceId) {
                    $settlementMeta['supplemental_invoice_id'] = $supplementalInvoiceId;
                    $settlementMeta['termination_final_invoice_id'] = $finalInvoice->id;
                }

                $contract->refresh()->loadMissing('room');
                $contract->update([
                    'status' => ContractStatus::TERMINATED,
                    'terminated_at' => $contract->terminated_at ?? now(),
                    'meta' => array_merge($contract->meta ?? [], [
                        'termination_settlement' => array_merge($settlementMeta, [
                            'contract_terminated_with_open_debt' => true,
                        ]),
                    ]),
                ]);
                $contract->room?->update(['status' => 'available']);

                event(new SettlementPaymentRequired($contract->fresh(), $fpr));

                return [
                    'scenario' => 'B',
                    'final_payment_request_id' => $fpr->id,
                    'amount_due' => $D,
                    'supplemental_invoice_id' => $supplementalInvoiceId,
                    'termination_final_invoice_id' => $finalInvoice->id,
                ];
            }

            $refundReceiptId = null;
            $scenario = 'C';
            $payoutFromDeposit = max(0.0, $creditRemaining);

            $sumLines = $useReceiptLines
                ? round((float) collect($normalizedLines)->sum('amount'), 2)
                : 0.0;

            if ($useReceiptLines && $sumLines > 0.02) {
                if ($sumLines > $payoutFromDeposit + 0.02) {
                    throw ValidationException::withMessages([
                        'refund_receipt_lines' => [
                            'Tổng các dòng hoàn ('.number_format($sumLines, 2, '.', '').') không được vượt phần cọc còn lại sau cấn trừ ('.number_format($payoutFromDeposit, 2, '.', '').').',
                        ],
                    ]);
                }
                $totalRefundPayout = $sumLines;
            } else {
                $totalRefundPayout = round($payoutFromDeposit, 2);
            }

            $forfeitRemainingDeposit = filter_var($options['forfeit_remaining_deposit'] ?? false, FILTER_VALIDATE_BOOL);

            if ($totalRefundPayout > 0.02 && $forfeitRemainingDeposit) {
                $forfeitTotal = $totalRefundPayout;
                $prevForfeited = round((float) ($contract->forfeited_amount ?? 0), 2);
                $contract->update([
                    'forfeited_amount' => round($prevForfeited + $forfeitTotal, 2),
                    'deposit_status' => DepositStatus::FORFEITED,
                    'meta' => array_merge($contract->meta ?? [], [
                        'termination_settlement' => [
                            'scenario' => 'FORFEIT',
                            'forfeited_amount' => (string) $forfeitTotal,
                            'deposit_suppressed' => (string) $payoutFromDeposit,
                            'refund_total_suppressed' => (string) $totalRefundPayout,
                        ],
                    ]),
                ]);

                $this->ledgerService->recordTerminationDepositForfeit(
                    $contract->fresh(),
                    $forfeitTotal,
                    $finalInvoice->id
                );

                event(new SettlementResolved($contract->fresh(), $finalInvoice->fresh(), null));

                return [
                    'scenario' => 'FORFEIT',
                    'refund_receipt_id' => null,
                    'refund_amount' => 0.0,
                    'deposit_refund_portion' => $payoutFromDeposit,
                    'forfeited_amount' => $forfeitTotal,
                ];
            }

            if ($totalRefundPayout > 0.02) {
                $scenario = 'A';
                $receiptMeta = [
                    'note' => 'Hoàn trả sau quyết toán (FIFO cọc; dòng hoàn do manager nhập).',
                    'deposit_refund_portion' => $totalRefundPayout,
                ];
                if ($useReceiptLines) {
                    $receiptMeta['refund_receipt_lines'] = $normalizedLines;
                }

                $receipt = RefundReceipt::create([
                    'org_id' => $contract->org_id,
                    'contract_id' => $contract->id,
                    'amount' => $totalRefundPayout,
                    'meta' => $receiptMeta,
                ]);
                $refundReceiptId = $receipt->id;
                $contract->update([
                    'refunded_amount' => $totalRefundPayout,
                    'deposit_status' => DepositStatus::REFUND_PENDING,
                    'meta' => array_merge($contract->meta ?? [], [
                        'termination_settlement' => [
                            'scenario' => 'A',
                            'refund_receipt_id' => $refundReceiptId,
                            'refund_amount' => (string) $totalRefundPayout,
                            'deposit_refund_portion' => (string) $totalRefundPayout,
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
                'refund_amount' => $totalRefundPayout > 0.02 ? $totalRefundPayout : 0.0,
                'deposit_refund_portion' => ($scenario === 'A' && $totalRefundPayout > 0.02)
                    ? $totalRefundPayout
                    : $payoutFromDeposit,
            ];
        });
    }

    /**
     * @return array<int, array{description: string, amount: float}>
     */
    protected function normalizeRefundReceiptLines(mixed $refundReceiptLines): array
    {
        if (! is_array($refundReceiptLines)) {
            return [];
        }

        $out = [];
        foreach ($refundReceiptLines as $row) {
            if (! is_array($row)) {
                continue;
            }
            $d = trim((string) ($row['description'] ?? ''));
            $a = round(max(0.0, (float) ($row['amount'] ?? 0)), 2);
            if ($d === '' || $a <= 0) {
                continue;
            }
            $out[] = ['description' => $d, 'amount' => $a];
        }

        return $out;
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

    /**
     * @return array{0: string, 1: string} period_start, period_end (Y-m-d)
     */
    protected function allocateSupplementalInvoicePeriod(Contract $contract, Invoice $terminationInvoice): array
    {
        $cursor = Carbon::parse($terminationInvoice->period_end ?? $terminationInvoice->issue_date)->copy()->addDay();

        for ($i = 0; $i < 400; $i++) {
            $start = $cursor->toDateString();
            $end = $cursor->toDateString();

            $exists = Invoice::query()
                ->where('contract_id', $contract->id)
                ->whereDate('period_start', $start)
                ->whereDate('period_end', $end)
                ->where('is_termination', false)
                ->whereNotIn('status', ['CANCELLED'])
                ->exists();

            if (! $exists) {
                return [$start, $end];
            }

            $cursor->addDay();
        }

        throw new \RuntimeException('Không tìm được kỳ hóa đơn trống cho chứng từ nợ quyết toán bổ sung.');
    }

    protected function resolveActingUser(Contract $contract, array $options): User
    {
        $userId = $options['acting_user_id'] ?? null;
        if ($userId) {
            $user = User::query()->find($userId);
            if ($user && $user->org_id === $contract->org_id) {
                return $user;
            }
        }

        $admin = User::query()
            ->where('org_id', $contract->org_id)
            ->whereHas('roles', fn ($q) => $q->where('name', 'Admin'))
            ->orderBy('created_at')
            ->first();

        if ($admin) {
            return $admin;
        }

        $fallback = User::query()
            ->where('org_id', $contract->org_id)
            ->orderBy('created_at')
            ->first();

        if ($fallback) {
            return $fallback;
        }

        throw new \RuntimeException('Không có người dùng trong tổ chức để ghi điều chỉnh hóa đơn thanh lý.');
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
