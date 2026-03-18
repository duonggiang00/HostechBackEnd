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
        return response()->json([
            'two_factor' => true,
            'message' => 'Two factor authentication challenge required.',
        ], 200);
    }
}
