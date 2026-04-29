<?php

namespace App\Http\Responses\Auth;

use App\Models\Org\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\TwoFactorLoginResponse as TwoFactorLoginResponseContract;

class TwoFactorLoginResponse implements TwoFactorLoginResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        /** @var User */
        $user = auth()->user();
        $user->loadMissing(['roles', 'permissions']);

        // Revoke previous tokens
        $user->tokens()->delete();

        // Generate new Sanctum token
        $plainToken = $user->createToken(
            name: 'auth_token',
            expiresAt: now()->addDays(7)
        )->plainTextToken;

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
        ], 200);
    }
}
