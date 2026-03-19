<?php

namespace App\Services\Auth;

use App\Models\Org\User;
use App\Models\System\VerificationCode;
use App\Mail\Auth\OTPMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Laravel\Fortify\Contracts\TwoFactorAuthenticationProvider;

class MfaService
{
    public function __construct(
        protected TwoFactorAuthenticationProvider $provider
    ) {}

    /**
     * Generate and send Email OTP to user.
     */
    public function sendEmailOtp(User $user): void
    {
        $code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        VerificationCode::create([
            'email' => $user->email,
            'code' => $code,
            'type' => 'mfa_otp',
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($user->email)->send(new OTPMail($code));
    }

    /**
     * Verify the given code for the user based on their MFA method.
     */
    public function verifyCode(User $user, string $code, ?string $secret = null): bool
    {
        if ($user->mfa_method === 'email') {
            return $this->verifyEmailOtp($user->email, $code);
        }

        // Default to TOTP
        $otpSecret = $secret ?: decrypt($user->two_factor_secret);
        return $this->provider->verify($otpSecret, $code);
    }

    /**
     * Verify Email OTP from database.
     */
    protected function verifyEmailOtp(string $email, string $code): bool
    {
        $verification = VerificationCode::where('email', $email)
            ->where('code', $code)
            ->where('type', 'mfa_otp')
            ->where('used_at', null)
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($verification) {
            $verification->update(['used_at' => now()]);
            return true;
        }

        return false;
    }

    /**
     * Get QR Code SVG for TOTP setup.
     */
    public function getTwoFactorQrCodeSvg(User $user): string
    {
        return $this->provider->qrCodeSvg(
            config('app.name'),
            $user->email,
            decrypt($user->two_factor_secret)
        );
    }
}
