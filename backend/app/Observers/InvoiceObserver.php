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
     * Handle the Invoice "updating" event.
     */
    public function updating(Invoice $invoice): void
    {
        if ($invoice->isDirty('status') && $invoice->status === 'ISSUED') {
            $newSnapshot = $this->buildSnapshot($invoice);

            // Preserve is_initial flag so activateContractIfInitialInvoice() can detect initial invoices.
            // getOriginal() may return a raw JSON string (before cast) or a decoded array depending on
            // Laravel version, so handle both cases.
            $oldRaw = $invoice->getOriginal('snapshot');
            $oldSnapshot = is_array($oldRaw) ? $oldRaw : (is_string($oldRaw) ? (json_decode($oldRaw, true) ?? []) : []);
            if (! empty($oldSnapshot['is_initial'])) {
                $newSnapshot['is_initial'] = true;
            }

            $invoice->snapshot = $newSnapshot;
        }
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
            Log::error('Failed to record invoice status history: '.$e->getMessage());
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
                ->where('key', 'like', '%dashboard:manager:%')
                ->delete();
        } catch (\Exception $e) {
            Log::warning('Failed to clear dashboard cache for invoice: '.$e->getMessage());
        }
    }

    /**
     * Build invoice snapshot when transitioning to ISSUED.
     */
    private function buildSnapshot(Invoice $invoice): array
    {
        $invoice->loadMissing(['contract.primaryMember.user', 'room', 'items']);

        $primaryMember = $invoice->contract?->primaryMember;
        $tenantInfo = [
            'name' => $primaryMember?->name ?? $primaryMember?->user?->name ?? 'Unknown',
            'phone' => $primaryMember?->phone ?? $primaryMember?->user?->phone ?? null,
            'email' => $primaryMember?->email ?? $primaryMember?->user?->email ?? null,
        ];

        return [
            'room_code' => $invoice->room?->code,
            'contract_code' => $invoice->contract?->code,
            'tenant' => $tenantInfo,
            'items' => $invoice->items->map(function ($item) {
                return [
                    'id' => $item->id,
                    'type' => $item->type,
                    'description' => $item->description,
                    'amount' => $item->amount,
                    'quantity' => $item->quantity,
                    'total' => $item->total,
                ];
            })->toArray(),
            'snapshot_at' => now()->toIso8601String(),
        ];
    }
}
