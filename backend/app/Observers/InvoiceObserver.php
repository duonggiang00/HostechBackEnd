<?php

namespace App\Observers;

use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InvoiceObserver
{
    /**
     * Handle the Invoice "created" event.
     */
    public function created(Invoice $invoice): void
    {
        $this->recordStatusHistory($invoice, true);
        $this->clearDashboardCache($invoice);
    }

    /**
     * Handle the Invoice "updated" event.
     */
    public function updated(Invoice $invoice): void
    {
        if ($invoice->isDirty('status')) {
            $this->recordStatusHistory($invoice);
        }

        // Nếu số tiền thay đổi, cũng cần xóa cache báo cáo
        if ($invoice->isDirty(['total_amount', 'paid_amount', 'status'])) {
            $this->clearDashboardCache($invoice);
        }
    }

    /**
     * Handle the Invoice "deleted" event.
     */
    public function deleted(Invoice $invoice): void
    {
        $this->clearDashboardCache($invoice);
    }

    /**
     * Ghi lại lịch sử thay đổi trạng thái.
     */
    private function recordStatusHistory(Invoice $invoice, bool $isNew = false): void
    {
        try {
            InvoiceStatusHistory::create([
                'org_id' => $invoice->org_id,
                'invoice_id' => $invoice->id,
                'from_status' => $isNew ? null : $invoice->getOriginal('status'),
                'to_status' => $invoice->status,
                'note' => $invoice->status_history_note ?? null,
                'changed_by_user_id' => request()->user()?->id,
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to record invoice status history: " . $e->getMessage());
        }
    }

    /**
     * Xóa cache Dashboard liên quan đến tài chính.
     * Vì CACHE_STORE=database, ta sử dụng DB để xóa các key theo pattern.
     */
    private function clearDashboardCache(Invoice $invoice): void
    {
        try {
            // Xóa cache của Owner (toàn Org)
            DB::table('cache')
                ->where('key', 'like', "%dashboard:owner:{$invoice->org_id}%")
                ->delete();

            // Xóa cache của Manager (theo Property)
            DB::table('cache')
                ->where('key', 'like', "%dashboard:property:{$invoice->property_id}%")
                ->delete();

            // Xóa cache cá nhân của các Manager liên quan
            DB::table('cache')
                ->where('key', 'like', "%dashboard:manager:%")
                ->delete();
        } catch (\Exception $e) {
            Log::warning("Failed to clear dashboard cache for invoice: " . $e->getMessage());
        }
    }
}
