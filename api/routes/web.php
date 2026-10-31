<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Internal\StripeController;

if (!app()->environment('local')) {
    Route::get('/', function () {
        return redirect(config('app.redirect_frontend_url'));
    });
}

// Stripe callback routes
Route::get('/stripe-success', [StripeController::class, 'stripeSuccessPage'])->name('stripe.success');
Route::get('/stripe-cancel', [StripeController::class, 'stripeCancelPage'])->name('stripe.cancel');

/*
|--------------------------------------------------------------------------
| BoomBang CL community portal (web sessions + CSRF, not emulator tokens)
|--------------------------------------------------------------------------
*/
Route::prefix('portal')->group(function () {
    Route::get('session', [\App\Http\Controllers\Portal\PortalAuthController::class, 'session'])->middleware('throttle:60,1');
    Route::post('login', [\App\Http\Controllers\Portal\PortalAuthController::class, 'login'])->middleware('throttle:8,1');
    Route::post('register', [\App\Http\Controllers\Portal\PortalAuthController::class, 'register'])->middleware('throttle:3,1');

    Route::get('news', [\App\Http\Controllers\Portal\PortalContentController::class, 'news']);
    Route::get('catalog', [\App\Http\Controllers\Portal\PortalContentController::class, 'catalog']);
    Route::get('ranking', [\App\Http\Controllers\Portal\PortalContentController::class, 'ranking']);
    Route::get('status', [\App\Http\Controllers\Portal\PortalContentController::class, 'status']);

    Route::get('forum/threads', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'threads']);
    Route::get('forum/threads/{id}', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'thread'])->whereNumber('id');

    Route::middleware(['auth:web'])->group(function () {
        Route::post('logout', [\App\Http\Controllers\Portal\PortalAuthController::class, 'logout'])->middleware('throttle:20,1');
        Route::post('presence', [\App\Http\Controllers\Portal\PortalContentController::class, 'pulse'])->middleware('throttle:20,1');

        Route::post('news', [\App\Http\Controllers\Portal\PortalContentController::class, 'publish'])->middleware('throttle:6,1');
        Route::delete('news/{id}', [\App\Http\Controllers\Portal\PortalContentController::class, 'removeNews'])->whereNumber('id')->middleware('throttle:12,1');

        Route::post('forum/threads', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'createThread'])->middleware('throttle:4,1');
        Route::post('forum/threads/{id}/replies', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'reply'])->whereNumber('id')->middleware('throttle:12,1');
        Route::delete('forum/threads/{id}', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'removeThread'])->whereNumber('id')->middleware('throttle:12,1');

        Route::get('chat', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'chat'])->middleware('throttle:30,1');
        Route::post('chat', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'sendChat'])->middleware('throttle:8,1');
    });
});
