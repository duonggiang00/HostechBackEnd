<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\StoreUserInvitationRequest;
use App\Services\System\UserInvitationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class UserInvitationController extends Controller
{
    public function __construct(
        protected UserInvitationService $service
    ) {}

    /**
     * Tạo lời mời người dùng mới
     * 
     * Gửi magic link qua email cho người được mời (Ví dụ mời Owner, Manager, Staff hoặc Tenant).
     */
    public function store(StoreUserInvitationRequest $request)
    {
        $user = $request->user();
        
        try {
            DB::beginTransaction();
            
            $invitation = $this->service->createInvite($user, $request->validated());
            
            DB::commit();

            return response()->json([
                'message' => 'Invitation created successfully',
                'data' => $invitation
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * Xác thực Token lời mời
     * 
     * Dùng để Frontend kiểm tra xem Hash Token trên URL còn hợp lệ không trước khi mở Form Đăng ký.
     */
    public function validateToken(string $token)
    {
        try {
            $invitation = $this->service->validateToken($token);

            // Load org details if org_id is present
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
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
