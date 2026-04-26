<?php

namespace App\Mail\Contract;

use App\Models\Contract\Contract;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Sent to a prospective tenant who does not yet have an account.
 *
 * The email contains a signed invitation link that pre-fills their registration
 * form. After registering, the system automatically links them to the contract member.
 */
class ContractInvitationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Contract $contract,
        public readonly string   $inviteToken,
        public readonly array    $memberData,   // full_name, phone, identity_number...
    ) {}

    public function envelope(): Envelope
    {
        $roomCode     = $this->contract->room?->code ?? '—';
        $propertyName = $this->contract->property?->name ?? 'Tòa nhà';

        return new Envelope(
            subject: "Mời tham gia hợp đồng thuê phòng {$roomCode} tại {$propertyName}",
        );
    }

    public function content(): Content
    {
        $registerUrl = config('app.frontend_url', 'http://localhost:3000') . '/setup-account/' . $this->inviteToken;

        $roomCode     = $this->contract->room?->code ?? '—';
        $propertyName = $this->contract->property?->name ?? '—';
        $startDate    = $this->contract->start_date
            ? \Carbon\Carbon::parse($this->contract->start_date)->format('d/m/Y')
            : '—';

        return new Content(
            view: 'emails.contract.invitation',
            with: [
                'recipientName' => $this->memberData['full_name'] ?? 'Quý khách',
                'roomCode'      => $roomCode,
                'propertyName'  => $propertyName,
                'startDate'     => $startDate,
                'registerUrl'   => $registerUrl,
            ],
        );
    }
}
