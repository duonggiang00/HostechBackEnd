<?php

namespace App\Observers;

use App\Events\Finance\PaymentApproved;
use App\Events\Finance\PaymentVoided;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentObserver
{
    /**
     * Handle the Payment "created" event.
     */
    public function created(Payment $payment): void
    {
        $this->recordStatusHistory($payment, true);

        if ($payment->status === 'APPROVED') {
            PaymentApproved::dispatch($payment);
        }

        $this->clearFinancialCaches($payment);
    }

    /**
     * Handle the Payment "updated" event.
     */
    public function updated(Payment $payment): void
    {
        if ($payment->isDirty('status')) {
            $this->recordStatusHistory($payment);

            if ($payment->status === 'APPROVED') {
                PaymentApproved::dispatch($payment);
            } elseif ($payment->status === 'VOIDED' && $payment->getOriginal('status') === 'APPROVED') {
                // Đảo ngược sổ cái nếu thanh toán đã duyệt bị hủy
                PaymentVoided::dispatch($payment);
            }
        }

        // Xóa cache nếu số tiền hoặc trạng thái thay đổi
        if ($payment->isDirty(['amount', 'status'])) {
            $this->clearFinancialCaches($payment);
        }
    }

    /**
     * Handle the Payment "deleted" event.
     */
    public function deleted(Payment $payment): void
    {
        // Nếu payment bị xóa khi đang APPROVED, phát sự kiện voided để đảo sổ cái
        if ($payment->status === 'APPROVED') {
            PaymentVoided::dispatch($payment);
        }

        $this->clearFinancialCaches($payment);
    }

    /**
     * Ghi lại lịch sử thay đổi trạng thái thanh toán.
     */
    private function recordStatusHistory(Payment $payment, bool $isNew = false): void
    {
        try {
            PaymentStatusHistory::create([
                'org_id' => $payment->org_id,
                'payment_id' => $payment->id,
                'from_status' => $isNew ? null : $payment->getOriginal('status'),
                'to_status' => $payment->status,
                'note' => $payment->status_history_note ?? null,
                'changed_by_user_id' => request()->user()?->id,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record payment status history: " . $e->getMessage());
        }
    }

    /**
     * Clear all financial related caches.
     */
    protected function clearFinancialCaches(Payment $payment): void
    {
        try {
            // Xóa cache của Owner (toàn Org)
            DB::table('cache')
                ->where('key', 'like', "%dashboard:owner:{$payment->org_id}%")
                ->delete();

            // Xóa cache của Manager (theo Property)
            DB::table('cache')
                ->where('key', 'like', "%dashboard:property:{$payment->property_id}:%")
                ->delete();

            // Xóa cache Manager cá nhân
            DB::table('cache')
                ->where('key', 'like', "%dashboard:manager:%")
                ->delete();
        } catch (\Exception $e) {
            Log::warning("Failed to clear dashboard cache for payment: " . $e->getMessage());
        }
    }
}
