<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\MfaService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class TwoFactorAuthenticationController extends Controller
{
    public function __construct(
        protected MfaService $mfaService
    ) {}

    /**
     * Get MFA setup information.
     */
    public function setup(Request $request)
    {
        $user = $request->user();

        // If user doesn't have a secret yet, we might need to enable it via Fortify first
        // But for our hybrid, we just need to know if they WANT App or Email.

        return response()->json([
            'mfa_enabled' => $user->mfa_enabled,
            'mfa_method' => $user->mfa_method ?: 'totp',
            'has_totp_secret' => !empty($user->two_factor_secret),
        ]);
    }

    /**
     * Enable MFA with specific method.
     */
    public function enable(Request $request)
    {
        $request->validate([
            'method' => 'required|in:totp,email',
            'code' => 'required|string', // Verification code to confirm it works
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không chính xác.'],
            ]);
        }

        // Verify the code before enabling
        if (!$this->mfaService.verifyCode($user, $request->code)) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác thực không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        $user->update([
            'mfa_enabled' => true,
            'mfa_method' => $request->method,
        ]);

        return response()->json([
            'message' => 'Đã kích hoạt xác thực 2 lớp thành công.',
            'method' => $user->mfa_method,
        ]);
    }

    /**
     * Disable MFA.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không chính xác.'],
            ]);
        }

        $user->update([
            'mfa_enabled' => false,
        ]);

        return response()->json([
            'message' => 'Đã tắt xác thực 2 lớp.',
        ]);
    }
}
