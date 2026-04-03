<?php

namespace App\Features\Org\Http\Responses\Auth;

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
        /** @var \App\Features\Org\Models\User */
        $user = auth()->user();

        // Revoke previous tokens
        $user->tokens()->delete();

        // Generate new Sanctum token
        $plainToken = $user->createToken(
            name: 'auth_token',
            expiresAt: now()->addDays(7)
        )->plainTextToken;

        return response()->json([
            [
                'id'        => (string) $user->id,
                'full_name' => $user->full_name,
                'email'     => $user->email,
                'phone'     => $user->phone,
                // Single role string — sufficient for immediate post-login routing
                'role'      => $user->roles->first()?->name,
                // org_id so Owner can be scoped to their org without extra call
                'org_id'    => $user->org_id ? (string) $user->org_id : null,
                // Keep roles[] for backwards compat
                'roles'     => $user->roles->pluck('name'),
            ],
            'token' => $plainToken,
        ], 200);
    }
}
