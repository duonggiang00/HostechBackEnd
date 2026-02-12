<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
{
    /**
     * Create an HTTP response that represents the object.
     *
     * @param  \Illuminate\Http\Request  $request
     */
    public function toResponse($request): JsonResponse
    {
        /** @var \App\Models\User */
        $user = auth()->user();

        // Generate initial API token
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
        ], 201);
    }
}
