<?php

namespace App\Services\System;

use App\Models\System\UserInvitation;
use App\Models\Org\User;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Exception;
use InvalidArgumentException;

class UserInvitationService
{
    /**
     * Create a new user invitation
     */
    public function createInvite(User $inviter, array $data): UserInvitation
    {
        // Generate secure random token
        $data['token'] = Str::random(64);
        $data['invited_by'] = $inviter->id;
        $data['expires_at'] = Carbon::now()->addDays(7); // Invitations valid for 7 days

        $role = $data['role_name'];

        // Role hierarchy logic & Security checks
        if ($inviter->hasRole('Admin')) {
            // Admin can invite anyone. If inviting Owner, org_id must be null.
            if ($role === 'Owner') {
                $data['org_id'] = null;
            } elseif (empty($data['org_id'])) {
                throw new InvalidArgumentException("org_id is required when Admin invites $role");
            }
        } elseif ($inviter->hasRole('Owner')) {
            // Owner can only invite inside their Org
             if (in_array($role, ['Admin', 'Owner'])) {
                throw new InvalidArgumentException("Owner cannot invite $role");
             }
             $data['org_id'] = $inviter->org_id;
        } elseif ($inviter->hasRole('Manager')) {
            // Manager can only invite Staff/Tenant in their specific properties
             if (!in_array($role, ['Staff', 'Tenant'])) {
                throw new InvalidArgumentException("Manager cannot invite $role");
             }
             $data['org_id'] = $inviter->org_id;
             
             // Ensure requested properties are within Manager's scope
             $managerProps = $inviter->properties->pluck('id')->toArray();
             $requestedProps = $data['properties_scope'] ?? [];
             
             if (empty($requestedProps)) {
                 throw new InvalidArgumentException("Manager must specify property scope for the invite.");
             }

             if (count(array_diff($requestedProps, $managerProps)) > 0) {
                 throw new InvalidArgumentException("You can only invite users to properties you manage.");
             }
        } else {
             throw new Exception("You do not have permission to invite users.");
        }

        $invitation = UserInvitation::create($data);

        // TODO: Fire Job/Event to send email with Magic Link to $invitation->email
        // Mail::to($invitation->email)->queue(new UserInvitationMail($invitation));

        return $invitation;
    }

    /**
     * Validate a token
     */
    public function validateToken(string $token): UserInvitation
    {
        $invitation = UserInvitation::where('token', $token)
            ->whereNull('registered_at')
            ->where('expires_at', '>', Carbon::now())
            ->first();

        if (!$invitation) {
            throw new Exception("This invitation token is invalid or has expired.");
        }

        return $invitation;
    }
}
