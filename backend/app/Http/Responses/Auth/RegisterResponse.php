<?php

namespace App\Http\Responses\Auth;

use App\Models\Org\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;

class RegisterResponse implements RegisterResponseContract
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

        $user->recordLoginAt();

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
