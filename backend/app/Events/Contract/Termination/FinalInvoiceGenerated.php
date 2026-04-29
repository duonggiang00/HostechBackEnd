<?php

namespace App\Events\Contract\Termination;

use App\Models\Invoice\Invoice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FinalInvoiceGenerated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Invoice $invoice,
    ) {}

    public function broadcastOn(): array
    {
        $this->invoice->loadMissing('contract');
        $contract = $this->invoice->contract;
        if (! $contract) {
            return [];
        }

        return TerminationBroadcastChannels::forContract($contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.termination.final_invoice_generated';
    }

    public function broadcastWith(): array
    {
        $this->invoice->loadMissing('contract');

        return [
            'contract_id' => $this->invoice->contract_id,
            'property_id' => $this->invoice->property_id,
            'invoice_id' => $this->invoice->id,
            'pipeline_step' => 'final_invoice_generated',
            'message' => 'Đã phát hành hóa đơn thanh lý cuối, chuẩn bị quyết toán cọc.',
        ];
    }
}
