<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Adds stable fields for log aggregation (RED metrics / tracing docs).
 * Runs only on authenticated API routes (after Sanctum).
 */
class EnrichApiLogContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();
        Log::withContext([
            'route' => $route?->uri() ?? $request->path(),
            'http_method' => $request->method(),
        ]);

        if ($request->user()) {
            Log::withContext([
                'user_id' => (string) $request->user()->getAuthIdentifier(),
            ]);
        }

        return $next($request);
    }
}
