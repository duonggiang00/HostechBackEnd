<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\StoreUserInvitationRequest;
use App\Services\System\UserInvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

use App\Http\Resources\System\UserInvitationResource;
use App\Models\System\UserInvitation;
use Dedoc\Scramble\Attributes\Group;

/**
 * Lời mời người dùng (User Invitations)
 */
#[Group('Hệ thống')]
class UserInvitationController extends Controller
{
    public function __construct(
        protected UserInvitationService $service
    ) {}

    /**
     * Tạo lời mời người dùng mới
     */
    public function store(StoreUserInvitationRequest $request): UserInvitationResource
    {
        $this->authorize('create', UserInvitation::class);

        try {
            $invitation = $this->service->createInvite($request->user(), $request->validated());

            return new UserInvitationResource($invitation);
        } catch (Exception $e) {
            abort(400, $e->getMessage());
        }
    }

    /**
     * Xác thực Token lời mời
     */
    public function validateToken(string $token): \Illuminate\Http\JsonResponse
    {
        try {
            $invitation = $this->service->validateToken($token);

            if ($invitation->org_id) {
                $invitation->load('org:id,name');
            }

            return response()->json([
                'message' => 'Token is valid',
                'data' => [
                    'email' => $invitation->email,
                    'role_name' => $invitation->role_name,
                    'org' => $invitation->org,
                    'requires_org_creation' => is_null($invitation->org_id) && $invitation->role_name === 'Owner'
                ]
            ]);
        } catch (Exception $e) {
            abort(400, $e->getMessage());
        }
    }
}
