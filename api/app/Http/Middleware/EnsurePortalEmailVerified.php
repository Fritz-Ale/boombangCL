<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePortalEmailVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');

        // Legacy game accounts have no portal registration marker: do not
        // retrospectively lock them out just because their email is NULL.
        if ($user && $user->portal_email_verification_required_at !== null && $user->email_verified_at === null) {
            return response()->json([
                'message' => 'Confirma tu correo electrónico antes de usar las funciones sociales del portal.',
                'code' => 'email_verification_required',
            ], 403)->header('Cache-Control', 'no-store');
        }

        return $next($request);
    }
}
