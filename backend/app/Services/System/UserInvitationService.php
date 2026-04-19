<?php

namespace App\Services\System;

use App\Models\Contract\Contract;
use App\Models\Org\User;
use App\Models\System\UserInvitation;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\System\UserInvitationMail;
use App\Mail\Contract\ContractInvitationMail;

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
        $data['expires_at'] = Carbon::now()->addDays(7); // Lời mời có giá trị trong 7 ngày
        $data['registered_at'] = null; // Reset trạng thái nếu mời lại

        $role = $data['role_name'];

        // Role hierarchy logic & Security checks
        if ($inviter->hasRole('Admin')) {
            if ($role === 'Owner') {
                $data['org_id'] = null;
            } elseif (empty($data['org_id'])) {
                abort(422, "org_id là bắt buộc khi Admin mời $role");
            }
        } elseif ($inviter->hasRole('Owner')) {
            if (in_array($role, ['Admin', 'Owner'])) {
                abort(422, "Chủ sở hữu không thể mời $role");
            }
            $data['org_id'] = $inviter->org_id;
        } elseif ($inviter->hasRole('Manager')) {
            if (! in_array($role, ['Staff', 'Tenant'])) {
                abort(422, "Quản lý không thể mời $role");
            }
            $data['org_id'] = $inviter->org_id;

            $managerProps = $inviter->properties->pluck('id')->toArray();
            $requestedProps = $data['properties_scope'] ?? [];

            if (empty($requestedProps)) {
                abort(400, 'Quản lý phải chỉ định phạm vi bất động sản cho lời mời.');
            }

            if (count(array_diff($requestedProps, $managerProps)) > 0) {
                abort(400, 'Bạn chỉ có thể mời người dùng vào các bất động sản mà bạn quản lý.');
            }
        } else {
            abort(403, 'Bạn không có quyền mời người dùng.');
        }

        // Sử dụng updateOrCreate để tránh lỗi Duplicate Entry cho email chưa đăng ký
        $invitation = UserInvitation::updateOrCreate(
            ['email' => $data['email']],
            $data
        );

        Mail::to($invitation->email)->queue(new UserInvitationMail($invitation));

        return $invitation;
    }

    /**
     * Validate a token
     */
    public function validateToken(string $token): UserInvitation
    {
        $invitation = UserInvitation::where('token', $token)->first();

        if (! $invitation) {
            abort(400, 'Mã mời không hợp lệ hoặc không tồn tại.');
        }

        if ($invitation->registered_at) {
            abort(400, 'Lời mời này đã được sử dụng để đăng ký tài khoản. Vui lòng đăng nhập.');
        }

        if ($invitation->expires_at && $invitation->expires_at->isPast()) {
            abort(400, 'Liên kết mời đã hết hạn. Vui lòng liên hệ người quản lý để gửi lại lời mời mới.');
        }

        return $invitation;
    }

    /**
     * Accept a token and register the user
     */
    public function acceptToken(string $token, array $data): User
    {
        $invitation = $this->validateToken($token);

        DB::beginTransaction();
        try {
            // If it's an Owner invitation without an Org, create the Org first
            if (is_null($invitation->org_id) && $invitation->role_name === 'Owner') {
                if (empty($data['org_name'])) {
                    abort(422, 'Tên tổ chức (org_name) là bắt buộc để khởi tạo tài khoản Chủ sở hữu.');
                }
                $org = \App\Models\Org\Org::create(['name' => $data['org_name']]);
                $orgId = $org->id;
            } else {
                $orgId = $invitation->org_id;
            }

            // Create User
            $user = User::create([
                'org_id' => $orgId,
                'email' => $invitation->email,
                'full_name' => $data['full_name'],
                'password' => $data['password'],
                'is_active' => true,
            ]);

            // Assign Role
            $user->assignRole($invitation->role_name);

            // Assign properties scope if specified
            if (! empty($invitation->properties_scope)) {
                $user->properties()->sync($invitation->properties_scope);
            }

            // Mark invitation as registered
            $invitation->update(['registered_at' => Carbon::now()]);

            DB::commit();

            return $user;

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create an invitation specifically for a contract tenant (Path B).
     *
     * Unlike the generic createInvite(), this bypasses role-hierarchy checks because
     * it is issued programmatically during contract creation by a Manager/Owner.
     *
     * The invitation is stored in user_invitations with:
     *  - role_name = 'Tenant'
     *  - properties_scope = [contract->property_id]
     *  - meta stored in role_name compound field (kept simple: no new columns)
     *
     * When the prospective tenant registers via the link, acceptToken() links them to
     * the correct property automatically. The ContractMember will be updated
     * (user_id backfilled + status changed to PENDING) via a separate command/listener.
     */
    public function createContractInvite(
        User     $inviter,
        string   $email,
        Contract $contract,
        array    $memberData = [],
    ): UserInvitation {
        $data = [
            'token'             => Str::random(64),
            'role_name'         => 'Tenant',
            'org_id'            => $contract->org_id,
            'properties_scope'  => [$contract->property_id],
            'invited_by'        => $inviter->id,
            'expires_at'        => Carbon::now()->addDays(72 / 24),
            'registered_at'     => null, // Đảm bảo lời mời có thể sử dụng lại nếu mời lại
        ];

        // Tránh lỗi Duplicate Entry bằng cách cập nhật bản ghi cũ nếu có
        $invitation = UserInvitation::updateOrCreate(
            ['email' => $email],
            $data
        );

        Mail::to($email)->queue(new ContractInvitationMail(
            contract: $contract,
            inviteToken: $invitation->token,
            memberData: array_merge($memberData, ['email' => $email]),
        ));

        return $invitation;
    }
}
