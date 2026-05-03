<?php

namespace App\Listeners\Contract\Termination;

use App\Enums\ContractStatus;
use App\Events\Finance\InvoicePaidEvent;
use App\Models\Contract\Contract;
use App\Models\Contract\FinalPaymentRequest;
use App\Models\Invoice\Invoice;
use Illuminate\Support\Facades\DB;

class CheckAndResolvePendingSettlement
{
    public function handle(InvoicePaidEvent $event): void
    {
        $invoice = $event->invoice->fresh(['contract']);

        if (! $invoice->contract_id) {
            return;
        }

        $contract = Contract::query()->find($invoice->contract_id);

        if (! $contract) {
            return;
        }

        $outstandingStatuses = Invoice::outstandingDebtStatuses();

        $totalDebtRaw = Invoice::query()
            ->where('contract_id', $contract->id)
            ->whereIn('status', $outstandingStatuses)
            ->selectRaw('SUM(total_amount - paid_amount) as total_debt')
            ->value('total_debt');

        $totalDebt = round((float) ($totalDebtRaw ?? 0), 2);

        if ($totalDebt > 0.02) {
            return;
        }

        $pendingFpr = FinalPaymentRequest::query()
            ->where('contract_id', $contract->id)
            ->where('status', 'PENDING')
            ->exists();

        $legacyAwaitingTermination = $contract->status === ContractStatus::PENDING_SETTLEMENT;

        if (! $pendingFpr && ! $legacyAwaitingTermination) {
            return;
        }

        DB::transaction(function () use ($contract, $outstandingStatuses) {
            $contract = Contract::query()->lockForUpdate()->findOrFail($contract->id);

            $totalDebtLocked = round((float) (Invoice::query()
                ->where('contract_id', $contract->id)
                ->whereIn('status', $outstandingStatuses)
                ->selectRaw('SUM(total_amount - paid_amount) as total_debt')
                ->value('total_debt') ?? 0), 2);

            if ($totalDebtLocked > 0.02) {
                return;
            }

            FinalPaymentRequest::query()
                ->where('contract_id', $contract->id)
                ->where('status', 'PENDING')
                ->get()
                ->each(function (FinalPaymentRequest $fpr) {
                    $fpr->update([
                        'status' => 'SATISFIED',
                        'meta' => array_merge($fpr->meta ?? [], [
                            'settled_at' => now()->toIso8601String(),
                        ]),
                    ]);
                });

            if ($contract->status === ContractStatus::PENDING_SETTLEMENT) {
                $contract->update([
                    'status' => ContractStatus::TERMINATED,
                    'terminated_at' => $contract->terminated_at ?? now(),
                    'meta' => array_merge($contract->meta ?? [], [
                        'settlement_resolved_at' => now()->toIso8601String(),
                    ]),
                ]);

                return;
            }

            if ($contract->status === ContractStatus::TERMINATED) {
                $contract->update([
                    'meta' => array_merge($contract->meta ?? [], [
                        'post_termination_outstanding_cleared_at' => now()->toIso8601String(),
                    ]),
                ]);
            }
        });
    }
}
