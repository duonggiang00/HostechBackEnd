<?php

namespace App\Listeners\Finance;

use App\Events\Finance\PaymentVoided;
use App\Services\Finance\LedgerService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Records a credit (reversal) ledger entry when a payment is voided.
 *
 * This reverses the original debit entry created by RecordPaymentLedger,
 * restoring the accounts-receivable balance.
 */
class ReversePaymentLedger implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'finance';

    public function __construct(
        protected LedgerService $ledgerService
    ) {}

    public function handle(PaymentVoided $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Reversing ledger entry for voided payment', [
            'payment_id' => $payment->id,
            'amount'     => $payment->amount,
        ]);

        try {
            $this->ledgerService->reversePayment($payment);

            Log::info('[Finance][EDA] Ledger reversal recorded successfully', [
                'payment_id' => $payment->id,
            ]);
        } catch (\Exception $e) {
            Log::error('[Finance][EDA] Failed to reverse ledger entry', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
