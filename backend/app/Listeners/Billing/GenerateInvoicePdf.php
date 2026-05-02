<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Services\Invoice\InvoicePdfService;
use Illuminate\Support\Facades\Log;

/**
 * Sinh file PDF hóa đơn ngay khi sự kiện InvoiceGenerated được dispatch.
 *
 * Chạy đồng bộ (không ShouldQueue): bản mềm phải có cùng lúc với trạng thái ISSUED.
 * Nếu để queue (hàng billing), khi không chạy queue worker thì invoices đã tạo nhưng pdf_path vẫn null.
 */
class GenerateInvoicePdf
{
    public function __construct(
        protected InvoicePdfService $invoicePdfService
    ) {}

    public function handle(InvoiceGenerated $event): void
    {
        $invoice = $event->invoice;

        try {
            Log::info("Generating PDF for Invoice #{$invoice->id}");

            $path = $this->invoicePdfService->generate($invoice);

            Log::info("PDF generated for Invoice #{$invoice->id}: {$path}");
        } catch (\Throwable $e) {
            Log::error("Failed to generate PDF for Invoice #{$invoice->id}: ".$e->getMessage());

            throw $e;
        }
    }
}
