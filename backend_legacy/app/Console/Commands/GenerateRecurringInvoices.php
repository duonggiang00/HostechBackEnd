<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class GenerateRecurringInvoices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:generate-recurring-invoices {--org= : Filter by Organization ID} {--month= : Month for billing (YYYY-MM), defaults to current}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly invoices for active contracts, including rent and utility usage.';

    /**
     * Execute the console command.
     */
    public function handle(\App\Services\Invoice\RecurringBillingService $billingService)
    {
        $monthStr = $this->option('month') ?: now()->format('Y-m');
        $periodMonth = \Carbon\Carbon::parse($monthStr);
        $orgId = $this->option('org');

        $this->info('Generating recurring invoices for period: ' . $periodMonth->format('M Y'));

        $query = \App\Models\Org\Org::query();
        if ($orgId) {
            $query->where('id', $orgId);
        }

        $orgs = $query->get();

        if ($orgs->isEmpty()) {
            $this->error('No organizations found.');

            return 0;
        }

        foreach ($orgs as $org) {
            $this->comment("Processing Organization: {$org->name} ({$org->id})");
            $results = $billingService->generateMonthlyInvoices($org->id, $periodMonth);

            $this->info("  Total Contracts: {$results['total']}");
            $this->info("  Invoices Created: {$results['success']}");
            if ($results['failed'] > 0) {
                $this->warn("  Failed: {$results['failed']}");
                foreach ($results['errors'] as $error) {
                    $this->error("    - $error");
                }
            }
        }

        $this->info('Done.');

        return 0;
    }
}
