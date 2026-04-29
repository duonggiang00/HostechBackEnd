<?php

namespace App\Console\Commands;

use App\Models\Invoice\Invoice;
use App\Models\Invoice\InvoiceStatusHistory;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MarkOverdueInvoices extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'app:mark-overdue-invoices
                            {--dry-run : Preview without making changes}';

    /**
     * The console command description.
     */
    protected $description = 'Mark ISSUED/PARTIAL invoices as OVERDUE when past due_date';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->warn('🔍 DRY RUN mode — no changes will be made.');
        }

        // Query tất cả hóa đơn đã phát hành nhưng quá hạn
        $overdueInvoices = Invoice::whereIn('status', ['ISSUED', 'PARTIAL'])
            ->whereNotNull('due_date')
            ->where('due_date', '<', today())
            ->get();

        $count = $overdueInvoices->count();

        if ($count === 0) {
            $this->info('✅ Không có hóa đơn nào quá hạn cần xử lý.');

            return Command::SUCCESS;
        }

        $this->info("📋 Tìm thấy {$count} hóa đơn quá hạn.");

        if ($isDryRun) {
            $this->table(
                ['Invoice ID', 'Trạng thái hiện tại', 'Due Date', 'Org ID'],
                $overdueInvoices->map(fn ($inv) => [
                    $inv->id,
                    $inv->status,
                    $inv->due_date,
                    $inv->org_id,
                ])->toArray()
            );

            return Command::SUCCESS;
        }

        $processed = 0;
        $failed = 0;

        foreach ($overdueInvoices as $invoice) {
            try {
                DB::transaction(function () use ($invoice) {
                    $fromStatus = $invoice->status;

                    // Cập nhật trạng thái
                    $invoice->update(['status' => 'OVERDUE']);

                    // Ghi lịch sử trạng thái để audit log
                    InvoiceStatusHistory::create([
                        'org_id' => $invoice->org_id,
                        'invoice_id' => $invoice->id,
                        'from_status' => $fromStatus,
                        'to_status' => 'OVERDUE',
                        'note' => 'Tự động chuyển sang OVERDUE vì quá hạn thanh toán (due_date: '.$invoice->due_date.').',
                        'changed_by_user_id' => null, // System action
                    ]);
                });

                $processed++;
            } catch (\Throwable $e) {
                $failed++;
                Log::error("[MarkOverdueInvoices] Failed to mark invoice {$invoice->id}: ".$e->getMessage());
                $this->error("❌ Lỗi khi xử lý hóa đơn {$invoice->id}: ".$e->getMessage());
            }
        }

        $this->info("✅ Hoàn thành: {$processed} hóa đơn chuyển sang OVERDUE.".($failed > 0 ? " ⚠️  {$failed} lỗi." : ''));

        Log::info("[MarkOverdueInvoices] Processed {$processed}/{$count} invoices. Failures: {$failed}.");

        return $failed > 0 ? Command::FAILURE : Command::SUCCESS;
    }
}
