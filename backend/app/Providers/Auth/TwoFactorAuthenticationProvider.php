<?php

namespace App\Providers\Auth;

use App\Features\Org\Models\User;
use App\Features\Org\Services\MfaService;
use Laravel\Fortify\TwoFactorAuthenticationProvider as FortifyProvider;

class TwoFactorAuthenticationProvider extends FortifyProvider
{
    /**
     * Verify the given code for the given secret/email.
     *
     * @param  string  $secret
     * @param  string  $code
     * @return bool
     */
    public function verify($secret, $code)
    {
        // Get the challenged user from session
        $userId = request()->session()->get('fortify.two_factor_user_id');
        
        if ($userId) {
            $user = User::find($userId);
            if ($user && $user->mfa_enabled && $user->mfa_method === 'email') {
                return app(MfaService::class)->verifyCode($user, $code, $secret);
            }
        }

        // For TOTP or if user not in session (setup phase), use standard logic
        return parent::verify($secret, $code);
    }
}
