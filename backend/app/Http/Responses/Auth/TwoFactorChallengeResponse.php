<?php

namespace App\Http\Responses\Auth;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\TwoFactorChallengeResponse as TwoFactorChallengeResponseContract;

class TwoFactorChallengeResponse implements TwoFactorChallengeResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        $userId = $request->session()->get('fortify.two_factor_user_id');
        $user = $userId ? \App\Features\Org\Models\User::find($userId) : null;

        return response()->json([
            'two_factor' => true,
            'method' => ($user && $user->mfa_enabled) ? ($user->mfa_method ?: 'totp') : 'totp',
            'message' => 'Two factor authentication challenge required.',
        ], 200);
    }
}
