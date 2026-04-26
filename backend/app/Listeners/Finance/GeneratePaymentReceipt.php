<?php

namespace App\Listeners\Finance;

use App\Events\Finance\PaymentApproved;
use App\Services\Finance\ReceiptService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Automates PDF collection/generation when a payment is approved.
 * 
 * This runs in the background to ensure the main transaction is not blocked
 * by PDF rendering overhead.
 */
class GeneratePaymentReceipt implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The priority of the listener in the queue.
     */
    public string $queue = 'finance';

    public function __construct(
        protected ReceiptService $receiptService
    ) {}

    public function handle(PaymentApproved $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Generating receipt for payment', [
            'payment_id' => $payment->id,
            'amount' => $payment->amount,
        ]);

        try {
            // Service handles idempotency via updateOrCreate
            $this->receiptService->generateForPayment($payment);

            Log::info('[Finance][EDA] Receipt successfully generated', [
                'payment_id' => $payment->id,
            ]);
        } catch (\Exception $e) {
            Log::error('[Finance][EDA] Failed to generate receipt', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Re-throw if you want the queue to retry
            throw $e;
        }
    }
}
