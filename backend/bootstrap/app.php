<?php

use App\Exceptions\AccountLockedException;
use App\Http\Middleware\AssignRequestId;
use App\Http\Middleware\ResolveTenant;
use App\Support\FriendlySqlDuplicateMessage;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(append: [
            AssignRequestId::class,
            ResolveTenant::class,
        ]);

        $middleware->redirectTo(
            guests: fn () => response()->json(['message' => 'Unauthenticated.'], 401),
            users: '/admin'
        );
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->renderable(function (AccountLockedException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => $e->getMessage(),
                    'error_code' => 'ACCOUNT_LOCKED',
                ], 423);
            }
        });

        // Standardize JSON error responses for API requests
        $exceptions->renderable(function (ValidationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'The given data was invalid.',
                    'errors' => $e->errors(),
                ], 422);
            }
        });

        $exceptions->renderable(function (AuthenticationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                ], 401);
            }
        });

        $exceptions->renderable(function (AuthorizationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'You do not have permission to perform this action.',
                ], 403);
            }
        });

        $exceptions->renderable(function (NotFoundHttpException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'The requested resource was not found.',
                ], 404);
            }
        });

        $exceptions->renderable(function (UniqueConstraintViolationException $e, $request) {
            if ($request->expectsJson()) {
                return response()->json([
                    'message' => FriendlySqlDuplicateMessage::fromQueryException($e),
                ], 422);
            }
        });

        $exceptions->renderable(function (QueryException $e, $request) {
            if (! $request->expectsJson() || $e instanceof UniqueConstraintViolationException) {
                return null;
            }
            $state = $e->errorInfo[0] ?? '';
            if ($state !== '23000' && ! str_contains($e->getMessage(), '1062')) {
                return null;
            }

            return response()->json([
                'message' => FriendlySqlDuplicateMessage::fromQueryException($e),
            ], 422);
        });
    })
    ->create();
