<?php

namespace App\Services\Auth;

use App\Mail\Auth\OTPMail;
use App\Models\Org\User;
use App\Models\System\VerificationCode;
use BaconQrCode\Renderer\Color\Rgb;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\Fill;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Support\Facades\Mail;
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
     * Verify the given code for the user based on the explicitly provided method.
     * When $method is null, falls back to user->mfa_method for backward compatibility.
     */
    public function verifyCode(User $user, string $code, ?string $method = null, ?string $secret = null): bool
    {
        $resolvedMethod = $method ?? $user->mfa_method ?? 'totp';

        if ($resolvedMethod === 'email') {
            return $this->verifyEmailOtp($user->email, $code);
        }

        return $this->verifyTotp($user, $code, $secret);
    }

    /**
     * Verify TOTP code using the underlying provider.
     */
    public function verifyTotp(User $user, string $code, ?string $secret = null): bool
    {
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
     * Generate a new TOTP secret for the user.
     */
    public function generateSecret(): string
    {
        return $this->provider->generateSecretKey();
    }

    /**
     * Get QR Code SVG for TOTP setup.
     * Uses BaconQrCode (already installed via Fortify) to render the otpauth URL as SVG.
     */
    public function getTwoFactorQrCodeSvg(User $user, string $secret): string
    {
        $url = $this->provider->qrCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $svg = (new Writer(
            new ImageRenderer(
                new RendererStyle(192, 0, null, null, Fill::uniformColor(
                    new Rgb(255, 255, 255),
                    new Rgb(45, 55, 72)
                )),
                new SvgImageBackEnd
            )
        ))->writeString($url);

        return trim(substr($svg, strpos($svg, "\n") + 1));
    }

    /**
     * Return the list of currently enabled methods for a user, derived from mfa_methods.
     * Falls back to legacy mfa_method if mfa_methods is not populated yet.
     */
    public function enabledMethods(User $user): array
    {
        $methods = $user->mfa_methods;

        if (is_array($methods) && count($methods) > 0) {
            return $methods;
        }

        // Legacy fallback
        if ($user->mfa_enabled && $user->mfa_method) {
            return [$user->mfa_method];
        }

        return [];
    }

    /**
     * Add a method to the user's enabled methods.
     */
    public function addMethod(User $user, string $method): void
    {
        $methods = $this->enabledMethods($user);

        if (! in_array($method, $methods)) {
            $methods[] = $method;
        }

        $user->update([
            'mfa_methods' => $methods,
            'mfa_enabled' => true,
            'mfa_method' => $methods[0], // Keep legacy field as first/primary method
        ]);
    }

    /**
     * Remove a method from the user's enabled methods. Disables 2FA entirely if list becomes empty.
     */
    public function removeMethod(User $user, string $method): void
    {
        $methods = array_values(array_filter(
            $this->enabledMethods($user),
            fn ($m) => $m !== $method
        ));

        $updateData = ['mfa_methods' => $methods];

        if (empty($methods)) {
            $updateData['mfa_enabled'] = false;
            $updateData['mfa_method'] = null;
        } else {
            $updateData['mfa_method'] = $methods[0];
        }

        if ($method === 'totp') {
            $updateData['two_factor_secret'] = null;
            $updateData['two_factor_confirmed_at'] = null;
            $updateData['two_factor_recovery_codes'] = null;
        }

        $user->update($updateData);
    }

    /**
     * Check whether a given method is active for the user.
     */
    public function hasMethod(User $user, string $method): bool
    {
        return in_array($method, $this->enabledMethods($user));
    }
}
