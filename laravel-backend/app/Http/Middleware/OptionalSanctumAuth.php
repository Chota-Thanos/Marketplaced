<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Resolves the Sanctum user when a valid token is present, but never rejects
 * the request when one isn't. Used for public endpoints that return extra
 * personalised data (e.g. "did I already vote on this review?") for signed-in
 * callers without forcing everyone else to authenticate.
 */
class OptionalSanctumAuth
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->bearerToken()) {
            $user = Auth::guard('sanctum')->user();
            if ($user) {
                $request->setUserResolver(fn () => $user);
            }
        }

        return $next($request);
    }
}
