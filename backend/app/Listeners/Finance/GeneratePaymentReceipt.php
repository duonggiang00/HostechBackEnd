<?php

namespace App\Listeners\Finance;

use App\Events\Finance\PaymentSuccessfullyVerified;
use App\Services\Finance\ReceiptService;
use Illuminate\Support\Facades\Log;

/**
 * Sinh biên lai PDF (bản mềm) khi thanh toán được xác nhận.
 *
 * Chạy đồng bộ: path file và bản ghi receipts phải có ngay sau khi duyệt thanh toán.
 * Nếu để queue (hàng finance), khi không chạy worker thì không có PDF dù payment đã APPROVED.
 */
class GeneratePaymentReceipt
{
    public function __construct(
        protected ReceiptService $receiptService
    ) {}

    public function handle(PaymentSuccessfullyVerified $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Generating receipt for payment', [
            'payment_id' => $payment->id,
            'amount' => $payment->amount,
        ]);

        try {
            $this->receiptService->generateForPayment($payment);

            Log::info('[Finance][EDA] Receipt successfully generated', [
                'payment_id' => $payment->id,
            ]);
        } catch (\Throwable $e) {
            Log::error('[Finance][EDA] Failed to generate receipt', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
