<?php

namespace App\Http\Controllers\Api\System;

use App\Http\Controllers\Controller;
use App\Http\Requests\System\StoreUserInvitationRequest;
use App\Http\Resources\System\UserInvitationResource;
use App\Models\System\UserInvitation;
use App\Services\System\UserInvitationService;
use Dedoc\Scramble\Attributes\Group;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

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
     * Danh sách lời mời
     *
     * Trả về danh sách lời mời đã gửi, kèm thông tin tổ chức và người mời.
     * Admin thấy tất cả, Owner/Manager chỉ thấy lời mời trong phạm vi của mình.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', UserInvitation::class);

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);

        $query = UserInvitation::with(['org:id,name', 'inviter:id,full_name,email'])
            ->orderBy('created_at', 'desc');

        // Scope: Admin sees all, others see only their org
        /** @var \App\Models\Org\User $user */
        $user = $request->user();
        if (! $user->hasRole('Admin')) {
            $query->where('org_id', $user->org_id);
        }

        return UserInvitationResource::collection($query->paginate($perPage));
    }

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
     *
     * Dùng cho trang public setup-account. Không yêu cầu đăng nhập.
     */
    public function validateToken(string $token): JsonResponse
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
                    'requires_org_creation' => is_null($invitation->org_id) && $invitation->role_name === 'Owner',
                ],
            ]);
        } catch (Exception $e) {
            abort(400, $e->getMessage());
        }
    }

    /**
     * Thu hồi / Xóa lời mời
     *
     * Chỉ xóa được lời mời chưa được đăng ký (registered_at = null).
     */
    public function destroy(string $id): JsonResponse
    {
        $invitation = UserInvitation::find($id);

        if (! $invitation) {
            abort(404, 'Invitation not found');
        }

        $this->authorize('delete', $invitation);

        if ($invitation->registered_at) {
            return response()->json([
                'message' => 'Không thể xóa lời mời đã được đăng ký.',
            ], 422);
        }

        $invitation->delete();

        return response()->json(['message' => 'Invitation revoked successfully']);
    }

    /**
     * Chấp nhận lời mời và đăng ký tài khoản (Accept Invitation)
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $data = $request->validate([
            'full_name' => 'required|string|max:255',
            'password' => 'required|string|min:8|confirmed',
            'org_name' => 'nullable|string|max:255',
        ]);

        try {
            $user = $this->service->acceptToken($token, $data);

            return response()->json([
                'message' => 'Tài khoản đã được thiết lập thành công.',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'full_name' => $user->full_name,
                ],
            ]);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }
}
