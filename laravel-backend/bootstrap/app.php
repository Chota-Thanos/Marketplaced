<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            // 'admin' = may use the admin panel (sub-admins included).
            // 'manage-users' = may change who has access. Stacked on top of
            // 'admin' for the handful of routes sub-admins must not reach.
            'admin' => \App\Http\Middleware\EnsureUserIsAdmin::class,
            'manage-users' => \App\Http\Middleware\EnsureUserCanManageUsers::class,
            'auth.optional' => \App\Http\Middleware\OptionalSanctumAuth::class,
        ]);

        // This is a JSON-only API — there is no 'login' web route to redirect
        // guests to. Without this, unauthenticated requests that don't send an
        // explicit `Accept: application/json` header (most fetch() calls don't)
        // crash with a 500 (RouteNotFoundException) instead of a clean 401.
        $middleware->redirectGuestsTo(fn () => null);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
