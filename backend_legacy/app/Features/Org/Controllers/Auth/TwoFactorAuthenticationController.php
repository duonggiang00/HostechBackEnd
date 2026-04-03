<?php

namespace App\Features\Org\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Features\Org\Services\MfaService;
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

        return response()->json([
            'mfa_enabled' => $user->mfa_enabled,
            'mfa_method' => $user->mfa_method ?: 'totp',
            'has_totp_secret' => !empty($user->two_factor_secret),
        ]);
    }

    /**
     * Initialize MFA setup (generate secret or send OTP).
     */
    public function initialize(Request $request)
    {
        $request->validate([
            'method' => 'required|in:totp,email',
        ]);

        $user = $request->user();
        $method = $request->input('method');

        if ($method === 'email') {
            $this->mfaService->sendEmailOtp($user);
            return response()->json([
                'message' => 'Mã OTP đã được gửi về email của bạn.',
            ]);
        }

        // TOTP method
        $secret = $this->mfaService->generateSecret();
        
        // Store secret in session for confirmation step
        $request->session()->put('mfa_setup_secret', $secret);

        return response()->json([
            'secret_key' => $secret,
            'qr_code_svg' => $this->mfaService->getTwoFactorQrCodeSvg($user, $secret),
        ]);
    }

    /**
     * Enable MFA with specific method.
     */
    public function enable(Request $request)
    {
        $request->validate([
            'method' => 'required|in:totp,email',
            'code' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (!Hash::check($request->password, $user->password_hash)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không chính xác.'],
            ]);
        }

        $method = $request->input('method');
        $secret = null;

        if ($method === 'totp') {
            $secret = $request->session()->get('mfa_setup_secret');
            if (!$secret) {
                throw ValidationException::withMessages([
                    'method' => ['Vui lòng khởi tạo thiết lập TOTP trước.'],
                ]);
            }
        }

        // Verify the code
        if (!$this->mfaService->verifyCode($user, $request->input('code'), $secret)) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác thực không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        // Prepare update data
        $updateData = [
            'mfa_enabled' => true,
            'mfa_method' => $method,
            'two_factor_confirmed_at' => now(),
        ];

        if ($method === 'totp') {
            $updateData['two_factor_secret'] = encrypt($secret);
            $request->session()->forget('mfa_setup_secret');
        }

        $user->update($updateData);

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
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        return response()->json([
            'message' => 'Đã tắt xác thực 2 lớp.',
        ]);
    }
}
