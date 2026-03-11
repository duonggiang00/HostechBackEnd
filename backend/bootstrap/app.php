<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [\App\Http\Middleware\ResolveTenant::class]);

        $middleware->redirectTo(
            guests: fn () => response()->json(['message' => 'Unauthenticated.'], 401),
            users: '/admin'
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
