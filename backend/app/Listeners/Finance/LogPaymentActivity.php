<?php

namespace App\Listeners\Finance;

use App\Events\Finance\PaymentSuccessfullyVerified;
use App\Events\Finance\PaymentVoided;
use App\Models\Finance\PaymentStatusHistory;
use App\Models\Org\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

/**
 * Writes a structured activity log entry on every major payment lifecycle event.
 *
 * Subscribes to:
 *  - Finance\PaymentSuccessfullyVerified → logs 'payment.verified'
 *  - Finance\PaymentVoided → logs 'payment.voided'
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

    public function handleApproved(PaymentSuccessfullyVerified $event): void
    {
        $payment = $event->payment;

        Log::info('[Finance][EDA] Logging approved payment activity', [
            'payment_id' => $payment->id,
        ]);

        try {
            $payment->loadMissing('approvedBy', 'receivedBy');
            $causer = $payment->approvedBy ?? $payment->receivedBy;

            $activity = activity('payment')
                ->performedOn($payment)
                ->withProperties([
                    'amount' => (float) $payment->amount,
                    'method' => $payment->method,
                    'reference' => $payment->reference,
                    'property_id' => $payment->property_id,
                    'received_at' => $payment->received_at?->toIso8601String(),
                ]);

            if ($causer instanceof User) {
                $activity->causedBy($causer);
            }

            $activity->log('payment.verified');
        } catch (\Exception $e) {
            // Non-critical: do not re-throw; logging failure must not block payment flow
            Log::warning('[Finance][EDA] Failed to log approved payment activity', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
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
            $causerId = PaymentStatusHistory::query()
                ->where('payment_id', $payment->id)
                ->whereNotNull('changed_by_user_id')
                ->orderByDesc('created_at')
                ->value('changed_by_user_id');
            $causer = $causerId ? User::query()->find($causerId) : null;

            $activity = activity('payment')
                ->performedOn($payment)
                ->withProperties([
                    'amount' => (float) $payment->amount,
                    'voided_at' => now()->toIso8601String(),
                ]);

            if ($causer instanceof User) {
                $activity->causedBy($causer);
            }

            $activity->log('payment.voided');
        } catch (\Exception $e) {
            Log::warning('[Finance][EDA] Failed to log voided payment activity', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
