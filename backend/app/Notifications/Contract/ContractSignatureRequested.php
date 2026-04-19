<?php

namespace App\Notifications\Contract;

use App\Models\Contract\Contract;
use App\Models\Contract\ContractMember;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifies a Tenant that a new contract requires their e-signature.
 *
 * Channels:
 *  - database  → stored in `notifications` table, read by NotificationCenter
 *  - broadcast → pushed via Laravel Reverb on App.Models.User.{id} private channel
 *  - mail      → optional email summary
 */
class ContractSignatureRequested extends Notification implements ShouldQueue, ShouldBroadcast
{
    use Queueable;

    public function __construct(
        public readonly Contract $contract,
        public readonly ContractMember $member,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    // ─── In-app (database) ────────────────────────────────────────────────────

    public function toArray(object $notifiable): array
    {
        return [
            'type'         => 'contract.signature_requested',
            'contract_id'  => $this->contract->id,
            'room_code'    => $this->contract->room?->code,
            'property_name' => $this->contract->property?->name,
            'start_date'   => $this->contract->start_date,
            'message'      => "Bạn có hợp đồng thuê phòng {$this->contract->room?->code} mới cần xác nhận ký.",
            'action_url'   => "/contracts/{$this->contract->id}",
        ];
    }

    // ─── Broadcast (Reverb → Laravel Echo) ───────────────────────────────────
    // Delivered on: private-App.Models.User.{id}
    // Listened by: NotificationCenter.tsx → channel.notification(...)

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    // ─── Email ────────────────────────────────────────────────────────────────

    public function toMail(object $notifiable): MailMessage
    {
        $roomCode     = $this->contract->room?->code ?? '—';
        $propertyName = $this->contract->property?->name ?? '—';
        $startDate    = $this->contract->start_date
            ? \Carbon\Carbon::parse($this->contract->start_date)->format('d/m/Y')
            : '—';

        return (new MailMessage)
            ->subject("Hợp đồng thuê phòng {$roomCode} cần xác nhận ký")
            ->greeting("Xin chào {$notifiable->full_name}!")
            ->line("Bạn vừa được thêm vào hợp đồng thuê phòng tại **{$propertyName}**.")
            ->line("**Phòng:** {$roomCode}")
            ->line("**Ngày bắt đầu:** {$startDate}")
            ->line('Vui lòng đăng nhập vào hệ thống để xem chi tiết và xác nhận ký hợp đồng.')
            ->action('Xem & Ký hợp đồng', url("/contracts/{$this->contract->id}"))
            ->line('Nếu bạn có thắc mắc, vui lòng liên hệ với quản lý tòa nhà.');
    }
}
