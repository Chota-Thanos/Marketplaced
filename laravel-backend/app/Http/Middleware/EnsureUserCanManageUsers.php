<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards the routes a sub-admin must not reach: anything that changes who has
 * access, or moves money into someone's account.
 *
 * Applied *in addition to* the `admin` middleware rather than instead of it, so
 * the two questions stay separate — "are you staff" and "may you change who is
 * staff". A single combined check is how a role hierarchy quietly collapses
 * back into one level of privilege.
 */
class EnsureUserCanManageUsers
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user() || ! $request->user()->canManageUsers()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden — this action is restricted to full admins.',
            ], 403);
        }

        return $next($request);
    }
}
