<?php

namespace App\Mail\System;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public \App\Features\System\Models\UserInvitation $invitation
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Lời mời tham gia hệ thống Hostech',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.system.user-invitation',
            with: [
                'inviteLink' => config('app.frontend_url', 'http://localhost:3000') . '/setup-account?token=' . $this->invitation->token,
                'inviterName' => $this->invitation->inviter?->full_name ?? 'Quản trị viên',
                'orgName' => $this->invitation->org?->name ?? 'Tổ chức mới',
                'roleName' => $this->invitation->role_name,
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
