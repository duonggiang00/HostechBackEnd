<?php

namespace App\Listeners\Finance;

use App\Events\Finance\PaymentApproved;
use App\Services\Finance\LedgerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Records a debit ledger entry when a payment is approved.
 *
 * Accounting principle (double-entry):
 *  DEBIT  Cash/Bank account  (asset increases)
 *  CREDIT Accounts Receivable (receivable decreases)
 *
 * This listener replaces the direct $ledgerService->recordPayment() call
 * that was previously inlined inside PaymentService::create() and
 * PaymentService::approvePending().
 */
class RecordPaymentLedger implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'finance';

    public function __construct(
        protected LedgerService $ledgerService
    ) {}

    public function handle(PaymentApproved $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Recording ledger entry for approved payment', [
            'payment_id' => $payment->id,
            'amount'     => $payment->amount,
            'method'     => $payment->method,
        ]);

        try {
            $this->ledgerService->recordPayment($payment);

            Log::info('[Finance][EDA] Ledger entry recorded successfully', [
                'payment_id' => $payment->id,
            ]);
        } catch (\Exception $e) {
            Log::error('[Finance][EDA] Failed to record ledger entry', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
