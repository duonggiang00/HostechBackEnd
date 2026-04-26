<?php

namespace App\Listeners\Finance;

use App\Events\Finance\ReceiptGenerated;
use App\Models\Org\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use App\Notifications\Finance\PaymentReceivedNotification;

/**
 * Notifies the payer (tenant) after a receipt is successfully generated.
 * 
 * By listening to ReceiptGenerated instead of PaymentApproved,
 * we ensure the download link is available in the message.
 */
class NotifyTenantPaymentReceived implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public function handle(ReceiptGenerated $event): void
    {
        $receipt = $event->receipt;
        $payment = $receipt->payment;

        if (! $payment->payer_user_id) {
            Log::debug('[Finance][EDA] No payer attached to payment — skipping tenant notification', [
                'payment_id' => $payment->id,
            ]);
            return;
        }

        $payer = User::find($payment->payer_user_id);

        if (! $payer) {
            Log::warning('[Finance][EDA] Payer user not found for notification', [
                'payment_id'    => $payment->id,
                'payer_user_id' => $payment->payer_user_id,
            ]);
            return;
        }

        Log::info('[Finance][EDA] Sending payment received notification to tenant', [
            'payment_id' => $payment->id,
            'payer_id'   => $payer->id,
        ]);

        try {
            $payer->notify(new PaymentReceivedNotification($payment));
        } catch (\Exception $e) {
            Log::warning('[Finance][EDA] Failed to send payment notification', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
