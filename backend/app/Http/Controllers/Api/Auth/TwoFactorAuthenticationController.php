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
     * Returns enabled_methods, per-method flags and legacy fields.
     */
    public function setup(Request $request)
    {
        $user = $request->user();
        $enabledMethods = $this->mfaService->enabledMethods($user);

        return response()->json([
            'enabled_methods' => $enabledMethods,
            'mfa_enabled' => ! empty($enabledMethods),
            'mfa_method' => $user->mfa_method,
            'has_totp' => in_array('totp', $enabledMethods),
            'has_email' => in_array('email', $enabledMethods),
            'has_totp_secret' => ! empty($user->two_factor_secret),
        ]);
    }

    /**
     * Initialize MFA setup for a given method.
     * TOTP: generates secret + QR SVG.
     * Email: sends OTP to user email.
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

        // TOTP: generate secret, store in cache (keyed by user ID) for confirmation
        $secret = $this->mfaService->generateSecret();
        cache()->put('mfa_setup_secret_' . $user->id, $secret, now()->addMinutes(15));

        return response()->json([
            'secret_key' => $secret,
            'qr_code_svg' => $this->mfaService->getTwoFactorQrCodeSvg($user, $secret),
        ]);
    }

    /**
     * Enable (add) a specific MFA method after verifying code + password.
     */
    public function enable(Request $request)
    {
        $request->validate([
            'method' => 'required|in:totp,email',
            'code' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('password'), $user->password_hash)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không chính xác.'],
            ]);
        }

        $method = $request->input('method');
        $secret = null;

        if ($method === 'totp') {
            $secret = cache()->get('mfa_setup_secret_' . $user->id);
            if (! $secret) {
                throw ValidationException::withMessages([
                    'method' => ['Vui lòng khởi tạo thiết lập TOTP trước.'],
                ]);
            }
        }

        if (! $this->mfaService->verifyCode($user, $request->input('code'), $method, $secret)) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác thực không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        // Persist the TOTP secret before adding the method
        if ($method === 'totp') {
            $user->update([
                'two_factor_secret' => encrypt($secret),
                'two_factor_confirmed_at' => now(),
            ]);
            cache()->forget('mfa_setup_secret_' . $user->id);
        }

        $this->mfaService->addMethod($user, $method);

        return response()->json([
            'message' => 'Đã kích hoạt xác thực 2 lớp (' . strtoupper($method) . ') thành công.',
            'enabled_methods' => $this->mfaService->enabledMethods($user->fresh()),
        ]);
    }

    /**
     * Disable (remove) a specific MFA method after verifying password.
     * If no method is specified, all methods are disabled.
     */
    public function disable(Request $request)
    {
        $request->validate([
            'password' => 'required|string',
            'method' => 'nullable|in:totp,email',
        ]);

        $user = $request->user();

        if (! Hash::check($request->input('password'), $user->password_hash)) {
            throw ValidationException::withMessages([
                'password' => ['Mật khẩu không chính xác.'],
            ]);
        }

        $method = $request->input('method');

        if ($method) {
            $this->mfaService->removeMethod($user, $method);

            return response()->json([
                'message' => 'Đã tắt xác thực 2 lớp (' . strtoupper($method) . ').',
                'enabled_methods' => $this->mfaService->enabledMethods($user->fresh()),
            ]);
        }

        // Disable all methods
        $user->update([
            'mfa_enabled' => false,
            'mfa_method' => null,
            'mfa_methods' => [],
            'two_factor_secret' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ]);

        return response()->json([
            'message' => 'Đã tắt toàn bộ xác thực 2 lớp.',
            'enabled_methods' => [],
        ]);
    }
}
