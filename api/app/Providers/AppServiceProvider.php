<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(
            \Backpack\PermissionManager\app\Http\Controllers\UserCrudController::class,
            \App\Http\Controllers\Admin\UserCrudController::class
        );

        $this->app->bind(
            \Backpack\PermissionManager\app\Http\Controllers\RoleCrudController::class,
            \App\Http\Controllers\Admin\RoleCrudController::class
        );

        $this->app->bind(
            \Backpack\PermissionManager\app\Http\Controllers\PermissionCrudController::class,
            \App\Http\Controllers\Admin\PermissionCrudController::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Layer per-IP and per-account limits: one rotating IP must not
        // bypass registration, login or recovery protection for a target.
        // Only a SHA-256 fingerprint of user-supplied email/usernames is stored
        // in cache keys; never log them or store passwords as keys.
        $fingerprint = static function (mixed $input): string {
            $value = is_string($input) ? mb_strtolower(trim($input), 'UTF-8') : '';
            return hash('sha256', $value);
        };
        RateLimiter::for('portal-register', static function (Request $request) use ($fingerprint): array {
            return [
                Limit::perMinute(3)->by('portal-register-ip:' . $request->ip()),
                Limit::perHour(4)->by('portal-register-email:' . $fingerprint($request->input('email'))),
            ];
        });
        RateLimiter::for('portal-login', static function (Request $request) use ($fingerprint): array {
            return [
                Limit::perMinute(8)->by('portal-login-ip:' . $request->ip()),
                Limit::perMinute(6)->by('portal-login-account:' . $fingerprint($request->input('username'))),
            ];
        });
        RateLimiter::for('portal-resend-verification', static function (Request $request): array {
            return [
                Limit::perMinute(1)->by('portal-verify-ip:' . $request->ip()),
                Limit::perHour(3)->by('portal-verify-user:' . ($request->user('web')?->id ?? $request->ip())),
            ];
        });
        RateLimiter::for('portal-recovery', static function (Request $request) use ($fingerprint): array {
            return [
                Limit::perMinute(3)->by('portal-recovery-ip:' . $request->ip()),
                Limit::perHour(3)->by('portal-recovery-email:' . $fingerprint($request->input('email'))),
            ];
        });

        // Force HTTPS URLs in production
        if (config('app.env') === 'production') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
