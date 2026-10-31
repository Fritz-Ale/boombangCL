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
        Route::post('reports', [\App\Http\Controllers\Portal\PortalReportController::class, 'create'])->middleware('throttle:5,1');
        Route::get('reports', [\App\Http\Controllers\Portal\PortalReportController::class, 'index'])->middleware('throttle:30,1');
        Route::patch('reports/{id}', [\App\Http\Controllers\Portal\PortalReportController::class, 'review'])->whereNumber('id')->middleware('throttle:20,1');

        // Social endpoints use the authenticated web guard and CSRF protection.
        Route::get('friends', [\App\Http\Controllers\Portal\PortalSocialController::class, 'friendships']);
        Route::post('friends', [\App\Http\Controllers\Portal\PortalSocialController::class, 'requestFriend'])->middleware('throttle:6,1');
        Route::patch('friends/{id}/accept', [\App\Http\Controllers\Portal\PortalSocialController::class, 'acceptFriend'])->whereNumber('id')->middleware('throttle:12,1');
        Route::delete('friends/{id}', [\App\Http\Controllers\Portal\PortalSocialController::class, 'removeFriend'])->whereNumber('id')->middleware('throttle:12,1');

        Route::get('clan', [\App\Http\Controllers\Portal\PortalSocialController::class, 'clan']);
        Route::post('clan', [\App\Http\Controllers\Portal\PortalSocialController::class, 'createClan'])->middleware('throttle:3,1');
        Route::post('clan/invite', [\App\Http\Controllers\Portal\PortalSocialController::class, 'invite'])->middleware('throttle:6,1');
        Route::post('clan/invitations/{id}/respond', [\App\Http\Controllers\Portal\PortalSocialController::class, 'respondInvite'])->whereNumber('id')->middleware('throttle:12,1');
        Route::post('clan/leave', [\App\Http\Controllers\Portal\PortalSocialController::class, 'leaveClan'])->middleware('throttle:6,1');
        Route::delete('clan', [\App\Http\Controllers\Portal\PortalSocialController::class, 'disbandClan'])->middleware('throttle:3,1');

        Route::post('logout', [\App\Http\Controllers\Portal\PortalAuthController::class, 'logout'])->middleware('throttle:20,1');
        Route::post('presence', [\App\Http\Controllers\Portal\PortalContentController::class, 'pulse'])->middleware('throttle:20,1');

        Route::post('news', [\App\Http\Controllers\Portal\PortalContentController::class, 'publish'])->middleware('throttle:6,1');
        Route::delete('news/{id}', [\App\Http\Controllers\Portal\PortalContentController::class, 'removeNews'])->whereNumber('id')->middleware('throttle:12,1');

        Route::post('forum/threads', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'createThread'])->middleware('throttle:4,1');
        Route::post('forum/threads/{id}/replies', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'reply'])->whereNumber('id')->middleware('throttle:12,1');
        Route::delete('forum/threads/{id}', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'removeThread'])->whereNumber('id')->middleware('throttle:12,1');

        Route::patch('forum/threads/{id}/lock', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'lockThread'])->whereNumber('id')->middleware('throttle:12,1');
        Route::delete('forum/replies/{id}', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'removeReply'])->whereNumber('id')->middleware('throttle:12,1');
        Route::delete('chat/{id}', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'removeChat'])->whereNumber('id')->middleware('throttle:12,1');
        Route::get('chat', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'chat'])->middleware('throttle:30,1');
        Route::post('chat', [\App\Http\Controllers\Portal\PortalCommunityController::class, 'sendChat'])->middleware('throttle:8,1');
    });
});
