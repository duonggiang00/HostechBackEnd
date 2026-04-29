<?php

namespace App\Providers\Auth;

use Laravel\Fortify\TwoFactorAuthenticationProvider as FortifyProvider;

/**
 * Extends Fortify's TOTP provider.
 *
 * The custom MFA challenge (email OTP vs TOTP choice) is handled by
 * TwoFactorChallengeController using a cache-based challenge token.
 * This provider's verify() is only used by Fortify's own internal
 * two-factor pipeline (e.g., password confirmation flow). For the
 * main login challenge we bypass this provider entirely.
 */
class TwoFactorAuthenticationProvider extends FortifyProvider
{
    // Inherits generateSecretKey(), qrCodeUrl(), and verify() from FortifyProvider.
    // No overrides needed — the custom challenge flow is fully handled in
    // TwoFactorChallengeController + MfaService.
}
