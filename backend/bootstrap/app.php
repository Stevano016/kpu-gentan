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
        // Production sits behind Cloudflare and an openresty reverse proxy on the
        // gateway. nginx already rewrites the client address from CF-Connecting-IP;
        // this is the fallback so a forwarded request is still attributed to the
        // caller rather than to the proxy, which would make the login throttle
        // rate limit all users as one.
        $middleware->trustProxies(at: [
            '10.0.0.0/8',
            '127.0.0.1',
            '::1',
        ]);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
            'sekretariat.admin' => \App\Http\Middleware\EnsureSekretariatAdmin::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
