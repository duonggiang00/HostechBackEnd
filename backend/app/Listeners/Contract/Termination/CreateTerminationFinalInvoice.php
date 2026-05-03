<?php

namespace App\Listeners\Contract\Termination;

use App\Events\Contract\Termination\FinalInvoiceGenerated;
use App\Events\Contract\Termination\HandoverSubmitted;
use App\Models\Invoice\Invoice;
use App\Services\Contract\ContractService;
use App\Services\Invoice\InvoiceService;
use Illuminate\Support\Facades\DB;

class CreateTerminationFinalInvoice
{
    public function __construct(
        protected ContractService $contractService,
        protected InvoiceService $invoiceService,
    ) {}

    public function handle(HandoverSubmitted $event): void
    {
        // Tránh chạy trùng trong cùng request (một số môi trường đăng ký listener 2 lần cho class + @handle).
        $guardKey = 'termination.pipeline.final_invoice.'.$event->contract->id;
        if (app()->bound($guardKey)) {
            return;
        }
        app()->instance($guardKey, true);

        DB::transaction(function () use ($event) {
            $contract = $event->contract->fresh();
            $payload = $event->terminatePayload;
            $terminationDate = $payload['termination_date'] ?? now()->toDateString();
            $damageFee = (float) ($payload['damage_fee_total'] ?? 0);
            $penaltyAmount = (float) ($payload['penalty_amount'] ?? 0);

            $existing = Invoice::query()
                ->where('contract_id', $contract->id)
                ->where('is_termination', true)
                ->whereDate('period_start', $terminationDate)
                ->whereDate('period_end', $terminationDate)
                ->first();

            if ($existing) {
                event(new FinalInvoiceGenerated($existing->fresh()));

                return;
            }

            $items = $this->contractService->buildTerminationPipelineInvoiceItems(
                $contract,
                $terminationDate,
                array_merge($payload, [
                    'penalty_amount' => $penaltyAmount,
                    'damage_fee_total' => $damageFee,
                    'billing_mode' => $payload['billing_mode'] ?? 'combined',
                ])
            );

            foreach ($payload['additional_invoice_lines'] ?? [] as $line) {
                if (! is_array($line)) {
                    continue;
                }
                $desc = trim((string) ($line['description'] ?? ''));
                $amt = round((float) ($line['amount'] ?? 0), 2);
                if ($desc === '' || abs($amt) < 0.0001) {
                    continue;
                }
                $items[] = [
                    'type' => 'ADJUSTMENT',
                    'description' => $desc,
                    'quantity' => 1,
                    'unit_price' => $amt,
                    'amount' => $amt,
                ];
            }

            $autoReconcile = (bool) ($payload['auto_reconcile'] ?? true);

            $invoice = $this->invoiceService->create([
                'org_id' => $contract->org_id,
                'property_id' => $contract->property_id,
                'room_id' => $contract->room_id,
                'contract_id' => $contract->id,
                'status' => 'DRAFT',
                'issue_date' => $terminationDate,
                'due_date' => $terminationDate,
                'period_start' => $terminationDate,
                'period_end' => $terminationDate,
                'is_termination' => true,
                'snapshot' => [
                    'is_termination' => true,
                    'cancellation_party' => $payload['cancellation_party'] ?? null,
                    'is_early' => $contract->isTerminationBeforeScheduledEnd($terminationDate),
                    'pipeline' => 'eda_v1',
                    'billing_mode' => $payload['billing_mode'] ?? 'combined',
                    'auto_reconcile' => $autoReconcile,
                ],
            ], $items);

            $this->invoiceService->issueInvoice(
                $invoice,
                null,
                'Phát hành hóa đơn thanh lý cuối (EDA).'
            );

            event(new FinalInvoiceGenerated($invoice->fresh()));
        });
    }
}
