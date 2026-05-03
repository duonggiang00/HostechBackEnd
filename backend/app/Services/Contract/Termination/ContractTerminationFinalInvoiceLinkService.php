<?php

namespace App\Services\Contract\Termination;

use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Services\Contract\ContractService;
use App\Services\Handover\HandoverService;
use App\Services\Invoice\RecurringBillingService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Gắn một hóa đơn billing đã phát hành (ISSUED) làm hóa đơn thanh lý cuối — thay cho pipeline tự sinh dòng.
 *
 * Luồng legacy {@see ContractController::issueFinalInvoice} vẫn dùng {@see ContractTerminationPipelineService::runIssueOnly}.
 */
class ContractTerminationFinalInvoiceLinkService
{
    public function __construct(
        protected ContractService $contractService,
        protected HandoverService $handoverService,
        protected RecurringBillingService $recurringBillingService,
    ) {}

    /**
     * @param  array<string, mixed>  $data  Cùng khóa sync như issue-final-invoice: termination_date, cancellation_party, billing_mode, …
     */
    public function link(Contract $contract, string $invoiceId, array $data): Invoice
    {
        return DB::transaction(function () use ($contract, $invoiceId, $data) {
            $invoice = Invoice::query()->whereKey($invoiceId)->lockForUpdate()->first();
            if (! $invoice) {
                throw new UnprocessableEntityHttpException('Không tìm thấy hóa đơn.');
            }

            $this->assertInvoiceLinkableToContract($contract, $invoice);

            $terminationDate = $data['termination_date'] ?? now()->toDateString();
            $cancellationParty = $data['cancellation_party'] ?? null;
            $cancellationReason = $data['cancellation_reason'] ?? $data['reason'] ?? null;
            $waivePenalty = (bool) ($data['waive_penalty'] ?? false);
            $refundRemainingRent = (bool) ($data['refund_remaining_rent'] ?? false);
            $billingMode = ($data['billing_mode'] ?? 'combined') === 'split' ? 'split' : 'combined';

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
                        'pipeline' => 'billing_link_v1',
                        'billing_mode' => $billingMode,
                        'penalty_amount' => $penalty['penalty_amount'],
                        'penalty_rule_id' => $penalty['penalty_rule_id'],
                    ],
                ]),
            ]);

            $contract->refresh();

            if ($billingMode === 'split') {
                $this->ensureMonthlyInvoiceForTerminationMonth($contract->fresh(), $terminationDate);
            }

            $this->handoverService->ensureHandoverExistsForTermination(
                $contract->fresh(),
                auth()->check() ? auth()->id() : null
            );

            $existingTermination = Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('is_termination', true)
                ->where('id', '!=', $invoice->id)
                ->exists();

            if ($existingTermination) {
                throw new UnprocessableEntityHttpException(
                    'Hợp đồng đã có hóa đơn thanh lý khác. Dùng luồng cũ hoặc hủy HĐ thanh lý trước khi gắn HĐ mới.'
                );
            }

            $snapshot = array_merge($invoice->snapshot ?? [], [
                'is_termination' => true,
                'linked_from_billing' => true,
                'termination_date' => $terminationDate,
                'billing_mode' => $billingMode,
            ]);

            $invoice->update([
                'is_termination' => true,
                'period_start' => $terminationDate,
                'period_end' => $terminationDate,
                'snapshot' => $snapshot,
            ]);

            return $invoice->fresh()->loadMissing('items');
        });
    }

    protected function assertInvoiceLinkableToContract(Contract $contract, Invoice $invoice): void
    {
        if ((string) $invoice->contract_id !== (string) $contract->id) {
            throw new UnprocessableEntityHttpException('Hóa đơn không thuộc hợp đồng này.');
        }
        if ((string) $invoice->room_id !== (string) $contract->room_id) {
            throw new UnprocessableEntityHttpException('Hóa đơn không khớp phòng của hợp đồng.');
        }
        if ((string) $invoice->property_id !== (string) $contract->property_id) {
            throw new UnprocessableEntityHttpException('Hóa đơn không khớp tòa nhà của hợp đồng.');
        }
        if ((string) $invoice->org_id !== (string) $contract->org_id) {
            throw new UnprocessableEntityHttpException('Hóa đơn không khớp tổ chức.');
        }
        if ($invoice->trashed()) {
            throw new UnprocessableEntityHttpException('Hóa đơn đã bị xóa mềm.');
        }
        if ($invoice->status !== 'ISSUED') {
            throw new UnprocessableEntityHttpException('Chỉ gắn hóa đơn đã phát hành (ISSUED).');
        }
        if ($invoice->is_termination) {
            throw new UnprocessableEntityHttpException('Hóa đơn đã được đánh dấu là thanh lý.');
        }
    }

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
