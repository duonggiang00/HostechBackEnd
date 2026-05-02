<?php

namespace App\Services\Contract\Termination;

use App\Events\Contract\Termination\HandoverSubmitted;
use App\Events\Contract\Termination\TerminationInitiated;
use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use App\Services\Contract\ContractService;
use App\Services\Handover\HandoverService;
use Illuminate\Support\Facades\DB;

class ContractTerminationPipelineService
{
    public function __construct(
        protected ContractService $contractService,
        protected HandoverService $handoverService,
    ) {}

    /**
     * Chạy pipeline EDA đồng bộ trong một transaction DB.
     */
    public function run(Contract $contract, array $data): Invoice
    {
        return DB::transaction(function () use ($contract, $data) {
            $terminationDate = $data['termination_date'] ?? now()->toDateString();
            $cancellationParty = $data['cancellation_party'] ?? null;
            $cancellationReason = $data['cancellation_reason'] ?? $data['reason'] ?? null;
            $waivePenalty = (bool) ($data['waive_penalty'] ?? false);
            $refundRemainingRent = (bool) ($data['refund_remaining_rent'] ?? false);
            $isEarlyTermination = $contract->isEarlyTermination();

            $penalty = $this->contractService->resolveTerminationPipelinePenalty($contract, $data);

            $contract->update([
                'end_date' => $terminationDate,
                'cancellation_party' => $cancellationParty,
                'cancellation_reason' => $cancellationReason,
                'meta' => array_merge($contract->meta ?? [], [
                    'termination_details' => [
                        'is_early_termination' => $isEarlyTermination,
                        'cancellation_party' => $cancellationParty,
                        'cancellation_reason' => $cancellationReason,
                        'waive_penalty' => $waivePenalty,
                        'refund_remaining_rent' => $refundRemainingRent,
                        'pipeline' => 'eda_v1',
                        'penalty_amount' => $penalty['penalty_amount'],
                        'penalty_rule_id' => $penalty['penalty_rule_id'],
                    ],
                ]),
            ]);

            $contract->refresh();

            event(new TerminationInitiated($contract, array_merge($data, [
                'termination_date' => $terminationDate,
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
                ])
            ));

            return Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('is_termination', true)
                ->orderByDesc('created_at')
                ->firstOrFail();
        });
    }
}
