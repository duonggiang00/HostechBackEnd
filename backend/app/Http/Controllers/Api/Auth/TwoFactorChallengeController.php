<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Org\User;
use App\Services\Auth\MfaService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TwoFactorChallengeController extends Controller
{
    public function __construct(protected MfaService $mfaService) {}

    /**
     * Request an email OTP for the challenged user.
     * Caller must supply `challenge_token` returned from the login response.
     *
     * POST /api/auth/two-factor-challenge/request-otp
     * Body: { challenge_token: string }
     */
    public function requestOtp(Request $request)
    {
        $request->validate(['challenge_token' => 'required|string']);

        $user = $this->challengedUser($request->input('challenge_token'));

        if (! $this->mfaService->hasMethod($user, 'email')) {
            return response()->json(['message' => 'Phương thức email không được kích hoạt.'], 422);
        }

        $this->mfaService->sendEmailOtp($user);

        // Store selected method on the challenge cache entry
        $this->updateChallengeMethod($request->input('challenge_token'), 'email');

        return response()->json(['message' => 'Mã OTP đã được gửi về email của bạn.']);
    }

    /**
     * Verify the 2FA code for the challenged user and issue a Sanctum token.
     *
     * POST /api/auth/two-factor-challenge
     * Body: { challenge_token: string, code: string, method?: 'totp'|'email' }
     */
    public function store(Request $request)
    {
        $request->validate([
            'challenge_token' => 'required|string',
            'code' => 'required|string',
            'method' => 'nullable|in:totp,email',
        ]);

        $token = $request->input('challenge_token');
        $challengeData = cache()->get('mfa_challenge_'.$token);

        if (! $challengeData || ! isset($challengeData['user_id'])) {
            throw ValidationException::withMessages([
                'challenge_token' => ['Phiên xác thực không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        $user = User::find($challengeData['user_id']);
        if (! $user) {
            throw ValidationException::withMessages([
                'challenge_token' => ['Phiên xác thực không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        // Determine method: explicit param → stored in challenge → first enabled → default
        $method = $request->input('method')
            ?? ($challengeData['method'] ?? null)
            ?? ($this->mfaService->enabledMethods($user)[0] ?? 'totp');

        if (! $this->mfaService->hasMethod($user, $method)) {
            throw ValidationException::withMessages([
                'method' => ['Phương thức xác thực không hợp lệ.'],
            ]);
        }

        $secret = null;
        if ($method === 'totp' && $user->two_factor_secret) {
            $secret = decrypt($user->two_factor_secret);
        }

        if (! $this->mfaService->verifyCode($user, $request->input('code'), $method, $secret)) {
            throw ValidationException::withMessages([
                'code' => ['Mã xác thực không hợp lệ hoặc đã hết hạn.'],
            ]);
        }

        // Clear challenge token from cache
        cache()->forget('mfa_challenge_'.$token);

        // Revoke old tokens and issue new Sanctum token
        $user->tokens()->delete();
        $user->recordLoginAt();
        $plainToken = $user->createToken(
            name: 'auth_token',
            expiresAt: now()->addDays(7)
        )->plainTextToken;

        $user->loadMissing(['roles', 'permissions']);

        return response()->json([
            'user' => [
                'id' => (string) $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'org_id' => $user->org_id ? (string) $user->org_id : null,
                'role' => $user->roles->first()?->name,
                'roles' => $user->roles->pluck('name')->values()->all(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
            ],
            'token' => $plainToken,
        ]);
    }

    protected function challengedUser(string $token): User
    {
        $data = cache()->get('mfa_challenge_'.$token);

        if (! $data || ! $user = User::find($data['user_id'] ?? null)) {
            abort(response()->json(['message' => 'Phiên xác thực không hợp lệ hoặc đã hết hạn.'], 422));
        }

        return $user;
    }

    protected function updateChallengeMethod(string $token, string $method): void
    {
        $data = cache()->get('mfa_challenge_'.$token, []);
        $data['method'] = $method;
        cache()->put('mfa_challenge_'.$token, $data, now()->addMinutes(5));
    }
}
