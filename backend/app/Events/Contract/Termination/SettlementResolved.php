<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use App\Models\Invoice\Invoice;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SettlementResolved implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Contract $contract,
        public ?Invoice $settlementInvoice = null,
        public ?string $refundReceiptId = null,
    ) {}

    public function broadcastOn(): array
    {
        return TerminationBroadcastChannels::forContract($this->contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.settlement.resolved';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'status' => $this->contract->status instanceof \BackedEnum
                ? $this->contract->status->value
                : (string) $this->contract->status,
            'settlement_invoice_id' => $this->settlementInvoice?->id,
            'refund_receipt_id' => $this->refundReceiptId,
            'pipeline_step' => 'settlement_resolved',
            'message' => 'Quyết toán thanh lý đã hoàn tất.',
        ];
    }
}
