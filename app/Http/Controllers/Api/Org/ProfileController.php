<?php

namespace App\Http\Controllers\Api\Org;

use App\Http\Controllers\Controller;
use App\Http\Requests\Org\PasswordChangeRequest;
use App\Http\Requests\Org\ProfileUpdateRequest;
use App\Http\Resources\Org\UserResource;
use App\Services\Org\ProfileService;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;

/**
 * Quản lý Hồ sơ cá nhân
 */
#[Group('Hồ sơ cá nhân')]
class ProfileController extends Controller
{
    public function __construct(protected ProfileService $service) {}

    /**
     * Lấy thông tin hồ sơ cá nhân
     */
    public function show(Request $request)
    {
        $user = $request->user()->loadMissing('roles', 'permissions', 'media');

        return new UserResource($user);
    }

    /**
     * Cập nhật thông tin hồ sơ cá nhân
     */
    public function update(ProfileUpdateRequest $request)
    {
        $user = $this->service->update($request->user(), $request->validated());

        return new UserResource($user->loadMissing('roles', 'permissions', 'media'));
    }

    /**
     * Đổi mật khẩu
     */
    public function changePassword(PasswordChangeRequest $request)
    {
        $success = $this->service->changePassword(
            $request->user(),
            $request->validated('current_password'),
            $request->validated('password')
        );

        if (! $success) {
            abort(422, 'Mật khẩu hiện tại không đúng.');
        }

        return response()->json(['message' => 'Đổi mật khẩu thành công.']);
    }

    /**
     * Tải lên ảnh đại diện (Avatar)
     */
    public function uploadAvatar(\App\Http\Requests\Org\UploadAvatarRequest $request)
    {
        $avatarUrl = $this->service->uploadAvatar($request->user(), $request->file('avatar'));

        return response()->json([
            'message' => 'Cập nhật ảnh đại diện thành công.',
            'avatar_url' => $avatarUrl,
        ]);
    }

    /**
     * Kiểm tra trạng thái MFA / OTP của tài khoản
     */
    public function mfaStatus(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'mfa_enabled' => $user->mfa_enabled,
            'mfa_method' => $user->mfa_method,
            'mfa_enrolled_at' => $user->mfa_enrolled_at,
            'two_factor_enabled' => ! is_null($user->two_factor_confirmed_at),
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
        ]);
    }
}
