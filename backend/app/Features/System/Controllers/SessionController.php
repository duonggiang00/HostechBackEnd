<?php

namespace App\Features\System\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SessionController extends Controller
{
    /**
     * List all active sessions for the current user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $sessions = $user->tokens()
            ->get()
            ->map(function ($token) use ($user) {
                return [
                    'id' => $token->id,
                    'name' => $token->name,
                    'last_used_at' => $token->last_used_at,
                    'created_at' => $token->created_at,
                    'is_current' => $token->id === $user->currentAccessToken()->id,
                    'abilities' => $token->abilities,
                ];
            });

        return response()->json([
            'data' => $sessions,
        ]);
    }

    /**
     * Revoke a specific session.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $token = $user->tokens()->where('id', $id)->first();

        if (! $token) {
            return response()->json(['message' => 'Session not found'], 404);
        }

        $token->delete();

        return response()->json(['message' => 'Session revoked successfully']);
    }

    /**
     * Revoke all other sessions.
     */
    public function revokeOthers(Request $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()->id;

        $user->tokens()->where('id', '!=', $currentTokenId)->delete();

        return response()->json(['message' => 'Other sessions revoked successfully']);
    }
}
