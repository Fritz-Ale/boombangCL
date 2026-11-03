<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Notifications\PortalEmailVerificationNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;

class PortalEmailVerificationController extends Controller
{
    public static function deliveryReady(): bool
    {
        if (config('app.env') !== 'production') {
            return true;
        }

        // Explicit release gate: HTTPS and a plausible mailer are not proof
        // of actual mail delivery. An operator must verify inbox delivery.
        if (!filter_var(config('services.portal.mail_delivery_verified'), FILTER_VALIDATE_BOOLEAN)) {
            return false;
        }
        $mailer = strtolower((string) config('mail.default'));
        if (!in_array($mailer, ['smtp', 'ses', 'postmark', 'resend'], true)) {
            return false;
        }
        $from = strtolower(trim((string) config('mail.from.address')));
        if (!filter_var($from, FILTER_VALIDATE_EMAIL) ||
            str_ends_with($from, '@example.com') ||
            str_ends_with($from, '@localhost')) {
            return false;
        }
        return parse_url((string) config('app.url'), PHP_URL_SCHEME) === 'https'
            && parse_url((string) config('services.portal.frontend_url'), PHP_URL_SCHEME) === 'https';
    }

    public static function dispatch(User $user): void
    {
        $url = URL::temporarySignedRoute('portal.verify-email', now()->addMinutes(60), [
            'id' => $user->getKey(),
            'hash' => sha1($user->email),
        ]);

        $user->notify(new PortalEmailVerificationNotification($url));
    }

    public function verify(Request $request, int $id, string $hash): JsonResponse|RedirectResponse
    {
        $user = User::query()->findOrFail($id);

        if (!$user->active || $user->is_bot || !hash_equals(sha1($user->email), $hash)) {
            abort(403, 'Este enlace de verificación no es válido.');
        }

        if ($user->portal_email_verification_required_at !== null && $user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        // A redirect is built only from an administrator-configured origin.
        // Never accept a user-supplied redirect parameter.
        $frontend = rtrim((string) config('services.portal.frontend_url'), '/');
        if (!$request->expectsJson() && filter_var($frontend, FILTER_VALIDATE_URL) &&
            in_array(parse_url($frontend, PHP_URL_SCHEME), ['https', 'http'], true) &&
            (!app()->environment('production') || parse_url($frontend, PHP_URL_SCHEME) === 'https')) {
            $redirect = redirect()->away($frontend . '/cuenta.html?email=verified');
            $redirect->headers->set('Cache-Control', 'no-store');
            return $redirect;
        }

        return response()->json(['message' => 'Correo confirmado. Ya puedes utilizar el portal.'])
            ->header('Cache-Control', 'no-store');
    }

    public function resend(Request $request): JsonResponse
    {
        if (!self::deliveryReady()) {
            return response()->json([
                'message' => 'La verificación por correo todavía no está configurada.',
            ], 503)->header('Cache-Control', 'no-store');
        }

        $user = $request->user('web');

        if ($user && $user->active && !$user->is_bot &&
            $user->portal_email_verification_required_at !== null && $user->email_verified_at === null) {
            self::dispatch($user);
        }

        return response()->json([
            'message' => 'Si tu cuenta requiere confirmación, enviamos un enlace a tu correo.',
        ])->header('Cache-Control', 'no-store');
    }
}
