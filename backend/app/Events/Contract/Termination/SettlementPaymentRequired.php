<?php

namespace App\Events\Contract\Termination;

use App\Models\Contract\Contract;
use App\Models\Contract\FinalPaymentRequest;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SettlementPaymentRequired implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public Contract $contract,
        public FinalPaymentRequest $finalPaymentRequest,
    ) {}

    public function broadcastOn(): array
    {
        return TerminationBroadcastChannels::forContract($this->contract);
    }

    public function broadcastAs(): string
    {
        return 'contract.settlement.payment_required';
    }

    public function broadcastWith(): array
    {
        return [
            'contract_id' => $this->contract->id,
            'property_id' => $this->contract->property_id,
            'status' => $this->contract->status instanceof \BackedEnum
                ? $this->contract->status->value
                : (string) $this->contract->status,
            'final_payment_request_id' => $this->finalPaymentRequest->id,
            'amount_due' => (string) $this->finalPaymentRequest->amount_due,
            'invoice_id' => $this->finalPaymentRequest->invoice_id,
            'pipeline_step' => 'payment_required',
            'message' => 'Cần thanh toán nốt sau khi cấn trừ cọc.',
        ];
    }
}
