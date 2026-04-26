<?php

namespace App\Listeners\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Services\Invoice\InvoicePdfService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class GenerateInvoicePdf implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * The name of the connection the job should be sent to.
     */
    public $connection = 'redis';

    /**
     * The name of the queue the job should be sent to.
     */
    public $queue = 'billing';

    /**
     * Create the event listener.
     */
    public function __construct(
        protected InvoicePdfService $invoicePdfService
    ) {}

    /**
     * Handle the event.
     */
    public function handle(InvoiceGenerated $event): void
    {
        $invoice = $event->invoice;

        try {
            Log::info("Generating PDF for Invoice #{$invoice->id}");
            
            $path = $this->invoicePdfService->generate($invoice);
            
            Log::info("PDF generated for Invoice #{$invoice->id}: {$path}");
        } catch (\Exception $e) {
            Log::error("Failed to generate PDF for Invoice #{$invoice->id}: " . $e->getMessage());
            
            // Re-throw to allow queue retry if any
            throw $e;
        }
    }
}
