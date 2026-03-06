<?php

namespace App\Http\Responses\Auth;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;

class LoginResponse implements LoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        /** @var \App\Models\Org\User */
        $user = auth()->user();

        // Revoke previous tokens
        $user->tokens()->delete();

        // Generate new Sanctum token
        $plainToken = $user->createToken(
            name: 'auth_token',
            expiresAt: now()->addDays(7)
        )->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'roles' => $user->roles->pluck('name'),
            ],
            'token' => $plainToken,
        ], 200);
    }
}
