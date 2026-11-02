<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifyEmulatorToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (app()->environment('local')) {
            return $next($request);
        }
        $token = $request->header('X-Emulator-Token');
        $validToken = config('app.emulator_api_token');

        // Fallar de forma segura: null === null en el código anterior permitía
        // acceso sin token cuando la variable del servidor estaba vacía.
        if (!is_string($validToken) || trim($validToken) === '' ||
            $validToken === 'CHANGE_ME_EMULATOR_API_TOKEN') {
            return response()->json(['message' => 'Service configuration unavailable.'], 503);
        }

        if (!is_string($token) || !hash_equals($validToken, $token)) {
            return response()->json(['message' => 'Unauthorized.'], 401);
        }

        return $next($request);
    }
}
