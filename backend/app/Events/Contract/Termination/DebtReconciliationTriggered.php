<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DebtReconciliationTriggered implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Contract $contract,
        public Invoice $finalInvoice,
    ) {}

    public function broadcastOn(): array
    {
        return TerminationBroadcastChannels::forContract($this->contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.termination.debt_reconciliation';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'invoice_id' => $this->finalInvoice->id,
            'pipeline_step' => 'debt_reconciliation',
            'message' => 'Đang cấn trừ tiền cọc theo FIFO với các hóa đơn.',
        ];
    }
}
