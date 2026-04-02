<?php

namespace App\Actions\Fortify;

use App\Services\Auth\MfaService;
use Illuminate\Http\Request;
use Laravel\Fortify\Actions\RedirectIfTwoFactorAuthenticatable as FortifyRedirect;
use Laravel\Fortify\Fortify;

class RedirectIfTwoFactorAuthenticatable extends FortifyRedirect
{
    /**
     * Get the password execution stack for the given request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    protected function pipeline(Request $request)
    {
        return array_filter([
            // Standard Fortify pipeline
            function ($request, $next) {
                if (Fortify::confirmsPassword($request)) {
                    return $next($request);
                }

                return $next($request);
            },
            // Custom logic to send Email OTP if needed
            function ($request, $next) {
                // Fetch the user from the session, as they are not authenticated yet
                $userId = $request->session()->get('fortify.two_factor_user_id');
                $user = $userId ? \App\Features\Org\Models\User::find($userId) : null;

                if ($user && $user->mfa_enabled && $user->mfa_method === 'email') {
                    app(MfaService::class)->sendEmailOtp($user);
                }

                return $next($request);
            },
        ]);
    }

    /**
     * Create the response for a successful two-factor authentication challenge.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  mixed  $user
     * @return mixed
     */
    protected function twoFactorChallengeResponse($request, $user)
    {
        // If it's an API request, return the challenge JSON
        if ($request->wantsJson()) {
            return response()->json([
                'two_factor' => true,
                'method' => $user->mfa_method ?? 'totp',
            ]);
        }

        return parent::twoFactorChallengeResponse($request, $user);
    }
}
