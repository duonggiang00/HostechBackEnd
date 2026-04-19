<?php

namespace App\Jobs\Billing;

use App\Events\Billing\InvoiceGenerated;
use App\Models\Contract\Contract;
use App\Services\Invoice\RecurringBillingService;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Handles the asynchronous generation of a single invoice for one Contract.
 *
 * This Job is dispatched per-contract by RecurringBillingService,
 * allowing parallel processing across multiple queue workers.
 * Queue: 'billing' (separate from default to isolate load).
 */
class GenerateInvoiceForContractJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Number of retry attempts before failing.
     */
    public int $tries = 3;

    /**
     * Backoff strategy in seconds between retries.
     */
    public array $backoff = [30, 60, 120];

    /**
     * Maximum seconds before the job times out.
     */
    public int $timeout = 120;

    public function __construct(
        public Contract $contract,
        public Carbon   $periodMonth,
        public ?Carbon  $customPeriodStart = null,
        public ?Carbon  $customPeriodEnd   = null
    ) {}

    /**
     * Execute the job.
     */
    public function handle(RecurringBillingService $billingService): void
    {
        Log::info('[Billing] Processing contract invoice', [
            'contract_id' => $this->contract->id,
            'period'      => $this->periodMonth->format('Y-m'),
        ]);

        try {
            $invoice = $billingService->generateInvoiceForContract(
                $this->contract,
                $this->periodMonth,
                $this->customPeriodStart,
                $this->customPeriodEnd
            );

            // Dispatch event so listeners (notifications, ledger, etc.) can react
            InvoiceGenerated::dispatch($invoice);

            Log::info('[Billing] Invoice created successfully', [
                'invoice_id'  => $invoice->id,
                'contract_id' => $this->contract->id,
            ]);
        } catch (\Exception $e) {
            Log::error('[Billing] Failed to generate invoice for contract', [
                'contract_id' => $this->contract->id,
                'error'       => $e->getMessage(),
            ]);

            // Re-throw so the queue marks the job as failed and retries
            throw $e;
        }
    }

    /**
     * Handle a job failure (after all retries exhausted).
     */
    public function failed(\Throwable $exception): void
    {
        Log::critical('[Billing] GenerateInvoiceForContractJob permanently failed', [
            'contract_id' => $this->contract->id,
            'period'      => $this->periodMonth->format('Y-m'),
            'error'       => $exception->getMessage(),
        ]);
    }
}
