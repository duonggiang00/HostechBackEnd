<?php

namespace App\Notifications\Contract;

use App\Models\Contract\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class ContractSignedNotification extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public readonly Contract $contract,
        public readonly string $signerName
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'        => 'contract.signed',
            'contract_id' => $this->contract->id,
            'room_code'   => $this->contract->room?->code,
            'signer_name' => $this->signerName,
            'message'     => "Người thuê {$this->signerName} đã ký hợp đồng cho phòng {$this->contract->room?->code}.",
            'action_url'  => "/contracts/{$this->contract->id}",
        ];
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
