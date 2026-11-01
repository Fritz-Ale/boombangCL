<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PortalPasswordResetNotification;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class PortalPasswordController extends Controller
{
    public function requestLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:254'],
        ]);

        // Never redirect account recovery to an arbitrary host or an unconfigured domain.
        $base = rtrim((string) config('services.portal.frontend_url', ''), '/');
        $scheme = parse_url($base, PHP_URL_SCHEME);
        if (!$base || !filter_var($base, FILTER_VALIDATE_URL) ||
            !in_array($scheme, ['https', 'http'], true) ||
            (app()->environment('production') && $scheme !== 'https')) {
            return response()->json(['message' => 'El servicio de recuperación no está configurado.'], 503);
        }

        // Laravel's password broker hashes the stored token and applies an additional
        // per-email cooldown. The same response is returned for known/unknown emails.
        Password::broker('users')->sendResetLink(
            ['email' => $data['email']],
            function (User $user, string $token) use ($base) {
                if (!$user->active || $user->is_bot) {
                    return;
                }

                // A fragment keeps the token out of browser Referer headers and
                // normal HTTP server logs. JavaScript removes it from the address bar.
                $url = $base . '/restablecer.html#token=' .
                    rawurlencode($token) . '&email=' . rawurlencode($user->email);

                $user->notify(new PortalPasswordResetNotification($url));
            }
        );

        return response()->json([
            'message' => 'Si existe una cuenta elegible con ese correo, recibirás un enlace para restablecer la contraseña.',
        ])->header('Cache-Control', 'no-store');
    }

    public function reset(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email', 'max:254'],
            'token' => ['required', 'string', 'max:512'],
            'password' => ['required', 'confirmed', PasswordRule::min(10)],
        ]);

        $result = Password::broker('users')->reset($data, function (User $user, string $password) {
            if (!$user->active || $user->is_bot) {
                throw ValidationException::withMessages(['token' => 'El enlace ya no es válido.']);
            }

            $user->forceFill([
                'password' => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            // Revoke existing game Passport tokens as well as the reset token.
            // Clients holding prior access tokens must authenticate again.
            $user->tokens()->delete();
            // Invalidate existing browser sessions when the database session
            // driver is enabled, so old signed-in devices cannot stay logged in.
            if (config('session.driver') === 'database') {
                DB::table(config('session.table', 'sessions'))
                    ->where('user_id', $user->id)->delete();
            }
            event(new PasswordReset($user));
        });

        if ($result !== Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'El enlace es inválido o ha vencido. Solicita uno nuevo.',
            ], 422);
        }

        return response()->json(['message' => 'Contraseña actualizada. Inicia sesión con la nueva contraseña.'])
            ->header('Cache-Control', 'no-store');
    }
}
