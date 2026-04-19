<?php

namespace App\Notifications\Finance;

use App\Models\Finance\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notifies a tenant that their payment has been received and confirmed.
 *
 * Channels: database (in-app) + mail (optional)
 */
class PaymentReceivedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Payment $payment
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * In-app notification stored to the `notifications` table.
     */
    public function toArray(object $notifiable): array
    {
        $receipt = $this->payment->receipt;

        return [
            'type'        => 'payment.received',
            'payment_id'  => $this->payment->id,
            'amount'      => (float) $this->payment->amount,
            'method'      => $this->payment->method,
            'reference'   => $this->payment->reference,
            'received_at' => $this->payment->received_at?->toIso8601String(),
            'property_id' => $this->payment->property_id,
            'receipt_url' => $receipt ? asset('storage/' . $receipt->path) : null,
            'message'     => "Thanh toán {$this->payment->amount} VNĐ đã được ghi nhận thành công. Biên lai đã sẵn sàng.",
        ];
    }

    /**
     * Email notification (optional — only sent when mail channel is active).
     */
    public function toMail(object $notifiable): MailMessage
    {
        $amount      = number_format((float) $this->payment->amount, 0, '.', ',');
        $method      = $this->payment->method;
        $receivedAt  = $this->payment->received_at?->format('d/m/Y H:i') ?? 'N/A';
        $receipt     = $this->payment->receipt;

        $message = (new MailMessage)
            ->subject("Xác nhận thanh toán thành công - {$amount} VNĐ")
            ->greeting('Xin chào!')
            ->line("Chúng tôi xác nhận đã nhận được khoản thanh toán của bạn.")
            ->line("**Số tiền:** {$amount} VNĐ")
            ->line("**Phương thức:** {$method}")
            ->line("**Thời gian nhận:** {$receivedAt}")
            ->line("**Mã tham chiếu:** " . ($this->payment->reference ?? $this->payment->id));

        if ($receipt) {
            $message->action('Tải biên lai (PDF)', asset('storage/' . $receipt->path));
        } else {
            $message->action('Xem chi tiết thanh toán', url('/'));
        }

        return $message->line('Cảm ơn bạn đã tin tưởng sử dụng dịch vụ của chúng tôi.');
    }
}
