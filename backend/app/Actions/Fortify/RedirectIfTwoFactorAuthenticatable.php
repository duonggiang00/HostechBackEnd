<?php

namespace App\Actions\Fortify;

use App\Services\Auth\MfaService;
use Illuminate\Http\Request;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable as FortifyRedirect;

class RedirectIfTwoFactorAuthenticatable extends FortifyRedirect
{
    /**
     * Return the 2FA challenge response with available_methods so the
     * frontend can let the user choose which method to use.
     * No OTP is sent automatically — the user initiates via
     * POST /api/auth/two-factor-challenge/request-otp.
     */
    protected function twoFactorChallengeResponse($request, $user)
    {
        // Also keep session-based storage for Fortify's own internal challenge pipeline
        if ($request->hasSession()) {
            $request->session()->put([
                'login.id' => $user->getKey(),
                'login.remember' => $request->boolean('remember'),
            ]);
        }

        if ($request->wantsJson()) {
            $enabledMethods = app(MfaService::class)->enabledMethods($user);

            // Generate a short-lived challenge token stored in cache (stateless alternative to sessions)
            $challengeToken = \Illuminate\Support\Str::uuid()->toString();
            cache()->put('mfa_challenge_' . $challengeToken, [
                'user_id' => $user->getKey(),
            ], now()->addMinutes(5));

            return response()->json([
                'two_factor' => true,
                'challenge_token' => $challengeToken,
                'available_methods' => $enabledMethods,
                'method' => $user->mfa_method ?? ($enabledMethods[0] ?? 'totp'),
            ]);
        }

        return parent::twoFactorChallengeResponse($request, $user);
    }
}
