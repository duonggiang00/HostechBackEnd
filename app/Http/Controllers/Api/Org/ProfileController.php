<?php

namespace App\Http\Controllers\Api\Org;

use App\Http\Controllers\Controller;
use App\Http\Resources\Org\UserResource;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Rule;

/**
 * Quản lý Hồ sơ cá nhân
 *
 * API cho user quản lý thông tin hồ sơ cá nhân của mình.
 */
#[Group('Hồ sơ cá nhân')]
class ProfileController extends Controller
{
    /**
     * Lấy thông tin hồ sơ cá nhân
     *
     * Trả về đầy đủ thông tin profile của user đang đăng nhập,
     * bao gồm avatar, thông tin định danh, vai trò và trạng thái MFA.
     */
    public function show(Request $request)
    {
        $user = $request->user()->loadMissing('roles', 'permissions', 'media');
        return new UserResource($user);
    }

    /**
     * Cập nhật thông tin hồ sơ cá nhân
     *
     * Cho phép user cập nhật thông tin cá nhân bao gồm tên, email, số điện thoại,
     * thông tin định danh (CMND/CCCD), ngày sinh và địa chỉ.
     *
     * @bodyParam full_name string required Họ và tên. Example: Nguyễn Văn A
     * @bodyParam email string required Email. Example: user@example.com
     * @bodyParam phone string Số điện thoại. Example: 0901234567
     * @bodyParam identity_number string Số CMND/CCCD/Hộ chiếu. Example: 001234567890
     * @bodyParam identity_issued_date string Ngày cấp (YYYY-MM-DD). Example: 2020-01-15
     * @bodyParam identity_issued_place string Nơi cấp. Example: Cục Cảnh sát ĐKQL cư trú
     * @bodyParam date_of_birth string Ngày sinh (YYYY-MM-DD). Example: 1995-06-20
     * @bodyParam address string Địa chỉ thường trú. Example: 123 Đường ABC, Quận 1, TP.HCM
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'full_name'             => ['required', 'string', 'max:255'],
            'email'                 => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'identity_number'       => ['nullable', 'string', 'max:20'],
            'identity_issued_date'  => ['nullable', 'date'],
            'identity_issued_place' => ['nullable', 'string', 'max:255'],
            'date_of_birth'         => ['nullable', 'date'],
            'address'               => ['nullable', 'string', 'max:500'],
        ]);

        $user->update($validated);

        return new UserResource($user->fresh()->loadMissing('roles', 'permissions', 'media'));
    }

    /**
     * Đổi mật khẩu
     *
     * Tenant / user tự đổi mật khẩu.
     * Yêu cầu cung cấp mật khẩu hiện tại để xác nhận danh tính.
     *
     * @bodyParam current_password string required Mật khẩu hiện tại. Example: oldpassword123
     * @bodyParam password string required Mật khẩu mới (tối thiểu 8 ký tự). Example: newStrongPass!1
     * @bodyParam password_confirmation string required Xác nhận mật khẩu mới. Example: newStrongPass!1
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
        ]);

        if (!Hash::check($request->current_password, $user->getAuthPassword())) {
            return response()->json([
                'message' => 'Mật khẩu hiện tại không đúng.',
                'errors' => ['current_password' => ['Mật khẩu hiện tại không đúng.']],
            ], 422);
        }

        $user->password = $request->password; // Uses setPasswordAttribute mutator
        $user->save();

        return response()->json(['message' => 'Đổi mật khẩu thành công.']);
    }

    /**
     * Tải lên ảnh đại diện (Avatar)
     *
     * Upload và cập nhật ảnh đại diện của user.
     * Chấp nhận JPEG, PNG, WebP tối đa 2MB.
     *
     * @bodyParam avatar file required File ảnh (jpg, png, webp, tối đa 2MB).
     */
    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'],
        ]);

        $user = $request->user();

        // Xoá avatar cũ trước khi upload mới
        $user->clearMediaCollection('avatar');

        $user->addMediaFromRequest('avatar')
             ->usingFileName('avatar_' . $user->id . '.' . $request->file('avatar')->extension())
             ->toMediaCollection('avatar');

        return response()->json([
            'message'    => 'Cập nhật ảnh đại diện thành công.',
            'avatar_url' => $user->getFirstMediaUrl('avatar'),
        ]);
    }

    /**
     * Kiểm tra trạng thái MFA / OTP của tài khoản
     *
     * Trả về thông tin về trạng thái bảo mật hai lớp của tài khoản hiện tại.
     */
    public function mfaStatus(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'mfa_enabled'          => $user->mfa_enabled,
            'mfa_method'           => $user->mfa_method,           // 'totp', 'sms', etc.
            'mfa_enrolled_at'      => $user->mfa_enrolled_at,
            // Fortify 2FA (TOTP via Google Authenticator)
            'two_factor_enabled'   => !is_null($user->two_factor_confirmed_at),
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at,
        ]);
    }
}
