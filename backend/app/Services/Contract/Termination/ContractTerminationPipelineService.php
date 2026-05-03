<?php

namespace App\Services\Contract\Termination;

use App\Events\Contract\Termination\HandoverSubmitted;
use App\Events\Contract\Termination\TerminationInitiated;
use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Services\Contract\ContractService;
use App\Services\Handover\HandoverService;
use App\Services\Invoice\RecurringBillingService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ContractTerminationPipelineService
{
    public function __construct(
        protected ContractService $contractService,
        protected HandoverService $handoverService,
        protected TerminationReconciliationService $reconciliationService,
        protected RecurringBillingService $recurringBillingService,
    ) {}

    /**
     * Chạy pipeline EDA đồng bộ trong một transaction DB.
     * Mặc định auto_reconcile=true (giữ tương thích): tự động cấn trừ cọc ngay sau khi phát hành HĐ thanh lý.
     */
    public function run(Contract $contract, array $data): Invoice
    {
        return DB::transaction(function () use ($contract, $data) {
            $terminationDate = $data['termination_date'] ?? now()->toDateString();
            $cancellationParty = $data['cancellation_party'] ?? null;
            $cancellationReason = $data['cancellation_reason'] ?? $data['reason'] ?? null;
            $waivePenalty = (bool) ($data['waive_penalty'] ?? false);
            $refundRemainingRent = (bool) ($data['refund_remaining_rent'] ?? false);
            $billingMode = ($data['billing_mode'] ?? 'combined') === 'split' ? 'split' : 'combined';
            $autoReconcile = (bool) ($data['auto_reconcile'] ?? true);

            $scheduledEndDateStr = $contract->end_date?->toDateString();
            $penaltyPayload = array_merge($data, [
                'termination_date' => $terminationDate,
                '_scheduled_end_date' => $scheduledEndDateStr,
            ]);
            $penalty = $this->contractService->resolveTerminationPipelinePenalty($contract, $penaltyPayload);

            $isEarlyTermination = $scheduledEndDateStr !== null
                && Carbon::parse($terminationDate)->startOfDay()->lt(Carbon::parse($scheduledEndDateStr)->startOfDay());

            $contract->update([
                'end_date' => $terminationDate,
                'cancellation_party' => $cancellationParty,
                'cancellation_reason' => $cancellationReason,
                'meta' => array_merge($contract->meta ?? [], [
                    'termination_details' => [
                        'scheduled_end_date' => $scheduledEndDateStr,
                        'is_early_termination' => $isEarlyTermination,
                        'cancellation_party' => $cancellationParty,
                        'cancellation_reason' => $cancellationReason,
                        'waive_penalty' => $waivePenalty,
                        'refund_remaining_rent' => $refundRemainingRent,
                        'pipeline' => 'eda_v1',
                        'billing_mode' => $billingMode,
                        'penalty_amount' => $penalty['penalty_amount'],
                        'penalty_rule_id' => $penalty['penalty_rule_id'],
                    ],
                ]),
            ]);

            $contract->refresh();

            // Khi billing_mode=split: bảo đảm HĐ định kỳ tháng cuối tồn tại trước khi sinh HĐ thanh lý.
            if ($billingMode === 'split') {
                $this->ensureMonthlyInvoiceForTerminationMonth($contract, $terminationDate);
            }

            event(new TerminationInitiated($contract, array_merge($data, [
                'termination_date' => $terminationDate,
                'billing_mode' => $billingMode,
                'auto_reconcile' => $autoReconcile,
            ])));

            $handover = $this->handoverService->ensureHandoverExistsForTermination(
                $contract->fresh(),
                auth()->check() ? auth()->id() : null
            );

            event(new HandoverSubmitted(
                $handover,
                $contract->fresh(),
                array_merge($data, [
                    'termination_date' => $terminationDate,
                    'penalty_amount' => $penalty['penalty_amount'],
                    'billing_mode' => $billingMode,
                    'auto_reconcile' => $autoReconcile,
                ])
            ));

            return Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('is_termination', true)
                ->orderByDesc('created_at')
                ->firstOrFail();
        });
    }

    /**
     * Chỉ phát hành hóa đơn cuối, không cấn trừ ngay (Manager xác nhận tiếp ở bước 6).
     */
    public function runIssueOnly(Contract $contract, array $data): Invoice
    {
        return $this->run($contract, array_merge($data, ['auto_reconcile' => false]));
    }

    /**
     * Chạy bước cấn trừ cọc / tạo refund-receipt hoặc final-payment-request.
     * Trả về mảng kết quả từ `TerminationReconciliationService::reconcile`.
     *
     * @return array<string, mixed>
     */
    public function runReconcileOnly(Contract $contract): array
    {
        $finalInvoice = Invoice::query()
            ->where('contract_id', $contract->id)
            ->where('is_termination', true)
            ->orderByDesc('created_at')
            ->firstOrFail();

        return $this->reconciliationService->reconcile($contract->fresh(), $finalInvoice->fresh(), [
            'acting_user_id' => auth()->id(),
        ]);
    }

    /**
     * Đảm bảo có HĐ định kỳ cho tháng chứa terminationDate (chế độ split).
     */
    protected function ensureMonthlyInvoiceForTerminationMonth(Contract $contract, string $terminationDate): ?Invoice
    {
        $periodStart = Carbon::parse($terminationDate)->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();

        $existing = Invoice::query()
            ->where('contract_id', $contract->id)
            ->where('is_termination', false)
            ->whereDate('period_start', $periodStart->toDateString())
            ->whereDate('period_end', $periodEnd->toDateString())
            ->whereIn('status', ['DRAFT', 'ISSUED', 'PARTIAL', 'PAID', 'OVERDUE'])
            ->orderByDesc('created_at')
            ->first();

        if ($existing) {
            return $existing;
        }

        return $this->recurringBillingService->generateInvoiceForContract($contract->fresh(), $periodStart);
    }
}
