<?php

namespace App\Listeners\Finance;

use App\Events\Finance\PaymentApproved;
use App\Events\Finance\PaymentVoided;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Facades\Activity;

/**
 * Writes a structured activity log entry on every major payment lifecycle event.
 *
 * Subscribes to:
 *  - Finance\PaymentApproved → logs 'payment.approved'
 *  - Finance\PaymentVoided   → logs 'payment.voided'
 *
 * Uses spatie/laravel-activitylog to write to the activity_log table,
 * providing a clean audit trail for accountants and admins.
 */
class LogPaymentActivity implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'finance';

    // ─────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────

    public function handleApproved(PaymentApproved $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Logging approved payment activity', [
            'payment_id' => $payment->id,
        ]);

        try {
            activity('payment')
                ->performedOn($payment)
                ->withProperties([
                    'amount'      => (float) $payment->amount,
                    'method'      => $payment->method,
                    'reference'   => $payment->reference,
                    'property_id' => $payment->property_id,
                    'received_at' => $payment->received_at?->toIso8601String(),
                ])
                ->log('payment.approved');
        } catch (\Exception $e) {
            // Non-critical: do not re-throw; logging failure must not block payment flow
            Log::warning('[Finance][EDA] Failed to log approved payment activity', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }

    public function handleVoided(PaymentVoided $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Logging voided payment activity', [
            'payment_id' => $payment->id,
        ]);

        try {
            activity('payment')
                ->performedOn($payment)
                ->withProperties([
                    'amount'    => (float) $payment->amount,
                    'voided_at' => now()->toIso8601String(),
                ])
                ->log('payment.voided');
        } catch (\Exception $e) {
            Log::warning('[Finance][EDA] Failed to log voided payment activity', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);
        }
    }
}
