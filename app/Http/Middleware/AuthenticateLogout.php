<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AuthenticateLogout
{
    public function handle(Request $request, Closure $next)
    {
        // Try to authenticate with web guard (session)
        if (auth('web')->check()) {
            return $next($request);
        }

        // Try to authenticate with sanctum guard (API token)
        if (auth('sanctum')->check()) {
            return $next($request);
        }

        return response()->json(['message' => 'Unauthenticated'], 401);
    }
}
