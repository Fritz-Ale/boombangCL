<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\PortalPasswordResetNotification;
use App\Notifications\PortalEmailVerificationNotification;
use Illuminate\Support\Facades\URL;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PortalFeatureTest extends TestCase
{
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();
        // An in-memory cache can survive between feature tests. Reset limiter
        // counters at each test boundary; each test still verifies its own
        // per-IP and per-account throttling within the same request sequence.
        \Illuminate\Support\Facades\Cache::flush();
    }

    private function player(string $username): User
    {
        return User::query()->create([
            'name' => $username,
            'username' => $username,
            'email' => strtolower($username) . '@example.test',
            'password' => Hash::make('safe-password-123'),
            'avatar' => 1,
            'lang' => 'es',
            'description' => '',
            'active' => true,
            'is_bot' => false,
        ]);
    }

    public function test_password_reset_email_allows_single_use_and_revokes_old_password(): void
    {
        Notification::fake();
        config()->set('services.portal.frontend_url', 'http://localhost:8001');

        $user = $this->player('ResetUsr');
        $this->postJson('/portal/forgot-password', ['email' => $user->email])
            ->assertOk();
        Notification::assertSentTo($user, PortalPasswordResetNotification::class);
        $notification = Notification::sent($user, PortalPasswordResetNotification::class)->first();
        $this->assertStringStartsWith('http://localhost:8001/restablecer.html#', $notification->url);
        parse_str((string) parse_url($notification->url, PHP_URL_FRAGMENT), $args);
        $this->assertSame($user->email, $args['email']);

        $body = [
            'email' => $user->email,
            'token' => $args['token'],
            'password' => 'my-new-password-123',
            'password_confirmation' => 'my-new-password-123',
        ];
        $this->postJson('/portal/reset-password', $body)->assertOk();
        $this->assertTrue(Hash::check('my-new-password-123', $user->fresh()->password));
        $this->postJson('/portal/login', [
            'username' => $user->username, 'password' => 'safe-password-123',
        ])->assertUnprocessable();
        $this->postJson('/portal/login', [
            'username' => $user->username, 'password' => 'my-new-password-123',
        ])->assertOk();
        // The same link cannot be used twice.
        $this->postJson('/portal/reset-password', $body)->assertUnprocessable();
    }

    public function test_recovery_does_not_reveal_unknown_emails_and_blocks_bot_login(): void
    {
        Notification::fake();
        config()->set('services.portal.frontend_url', 'http://localhost:8001');
        $this->postJson('/portal/forgot-password', ['email' => 'unknown@example.test'])
            ->assertOk()->assertJsonStructure(['message']);
        Notification::assertNothingSent();

        $bot = $this->player('BotLogin');
        $bot->forceFill(['is_bot' => true])->save();
        $this->postJson('/portal/login', [
            'username' => $bot->username, 'password' => 'safe-password-123',
        ])->assertUnprocessable();
        $this->postJson('/portal/forgot-password', ['email' => $bot->email])->assertOk();
        Notification::assertNothingSent();
    }

    public function test_expired_password_reset_token_cannot_be_reused(): void
    {
        Notification::fake();
        config()->set('services.portal.frontend_url', 'http://localhost:8001');
        $user = $this->player('ExpiredPwd');
        $this->postJson('/portal/forgot-password', ['email' => $user->email])->assertOk();
        $notification = Notification::sent($user, PortalPasswordResetNotification::class)->first();
        parse_str((string) parse_url($notification->url, PHP_URL_FRAGMENT), $params);

        \Illuminate\Support\Facades\DB::table('password_reset_tokens')
            ->where('email', $user->email)
            ->update(['created_at' => now()->subMinutes(75)]);

        $this->postJson('/portal/reset-password', [
            'email' => $user->email,
            'token' => $params['token'],
            'password' => 'replacement-password-123',
            'password_confirmation' => 'replacement-password-123',
        ])->assertUnprocessable();

        $this->assertTrue(Hash::check('safe-password-123', $user->fresh()->password));
    }

    public function test_recovery_requires_configured_frontend_url(): void
    {
        config()->set('services.portal.frontend_url', null);
        $this->postJson('/portal/forgot-password', ['email' => 'unknown@example.test'])
            ->assertStatus(503);
    }

    public function test_session_is_anonymous_by_default_and_guest_may_not_publish(): void
    {
        $this->getJson('/portal/session')->assertOk()->assertJsonPath('authenticated', false);
        $this->postJson('/portal/forum/threads', ['title' => 'Un tema', 'body' => 'Este texto es una prueba.'])
            ->assertUnauthorized();
        $this->getJson('/portal/news')->assertOk()->assertJsonStructure(['items']);
    }

    public function test_register_login_and_logout_use_web_sessions(): void
    {
        $this->postJson('/portal/register', [
            'username' => 'Nuevo123',
            'email' => 'nuevo123@example.test',
            'password' => 'strong-pass-123',
            'password_confirmation' => 'strong-pass-123',
            'website' => '',
        ])->assertCreated()->assertJsonPath('authenticated', true);

        $this->assertDatabaseHas('users', ['username' => 'Nuevo123']);
        $this->getJson('/portal/session')->assertOk()->assertJsonPath('authenticated', true);
        $this->postJson('/portal/logout')->assertOk()->assertJsonPath('authenticated', false);
        $this->postJson('/portal/login', [
            'username' => 'Nuevo123',
            'password' => 'strong-pass-123',
        ])->assertOk()->assertJsonPath('authenticated', true);
    }

    public function test_forum_and_chat_require_auth_and_persist_messages(): void
    {
        $user = $this->player('ForumUsr');
        $this->actingAs($user, 'web')
            ->postJson('/portal/forum/threads', [
                'title' => 'Mi primer tema',
                'body' => 'Contenido válido de nuestro foro.',
            ])->assertCreated();

        $this->assertDatabaseHas('portal_threads', ['title' => 'Mi primer tema']);
        $this->actingAs($user, 'web')
            ->postJson('/portal/chat', ['body' => 'Hola comunidad'])
            ->assertCreated();
        $this->actingAs($user, 'web')
            ->getJson('/portal/chat')->assertOk()->assertJsonPath('items.0.body', 'Hola comunidad');
    }

    public function test_friend_requests_can_only_be_accepted_by_recipient(): void
    {
        $from = $this->player('AmigoUno');
        $to = $this->player('AmigoDos');
        $this->actingAs($from, 'web')
            ->postJson('/portal/friends', ['username' => $to->username])
            ->assertCreated();
        $friendship = (int) \Illuminate\Support\Facades\DB::table('portal_friendships')->value('id');
        $this->actingAs($from, 'web')
            ->patchJson('/portal/friends/' . $friendship . '/accept')->assertNotFound();
        $this->actingAs($to, 'web')
            ->patchJson('/portal/friends/' . $friendship . '/accept')->assertOk();
        $this->assertDatabaseHas('portal_friendships', ['id' => $friendship, 'status' => 'accepted']);
    }

    public function test_clans_require_an_invitation_and_only_one_membership(): void
    {
        $owner = $this->player('ClanOwner');
        $guest = $this->player('ClanGuest');
        $this->actingAs($owner, 'web')->postJson('/portal/clan', [
            'name' => 'Kekos del Sur', 'description' => 'Grupo para nuestra comunidad.',
        ])->assertCreated();
        $this->actingAs($owner, 'web')
            ->postJson('/portal/clan/invite', ['username' => $guest->username])
            ->assertCreated();
        $invite = (int) \Illuminate\Support\Facades\DB::table('portal_clan_invites')->value('id');
        $this->actingAs($guest, 'web')
            ->postJson('/portal/clan/invitations/' . $invite . '/respond', ['accept' => true])
            ->assertOk();
        $this->actingAs($guest, 'web')->getJson('/portal/clan')
            ->assertOk()->assertJsonPath('clan.name', 'Kekos del Sur');
        $this->actingAs($guest, 'web')
            ->postJson('/portal/clan', ['name' => 'Otro Clan'])
            ->assertUnprocessable();
    }

    public function test_game_online_count_uses_internal_authenticated_service(): void
    {
        config()->set('services.portal_stats.url', 'http://server:3000');
        config()->set('services.portal_stats.token', 'private-test-secret');
        Http::fake(['http://server:3000/internal/portal-stats' => Http::response(['online_players' => 7], 200)]);
        $this->getJson('/portal/status')->assertOk()->assertJsonPath('game_online_count', 7);
        Http::assertSent(fn ($request) => $request->hasHeader('X-Portal-Stats-Token', 'private-test-secret'));
    }

    public function test_regular_user_can_report_a_thread_but_cannot_review_reports(): void
    {
        $author = $this->player('ReportUsr');
        $this->actingAs($author, 'web')
            ->postJson('/portal/forum/threads', [
                'title' => 'Tema a reportar',
                'body' => 'Este tema es un ejemplo para reportes.',
            ])->assertCreated();

        $threadId = (int) \Illuminate\Support\Facades\DB::table('portal_threads')->value('id');
        $other = $this->player('ReportDos');
        $this->actingAs($other, 'web')->postJson('/portal/reports', [
            'type' => 'thread', 'id' => $threadId,
            'reason' => 'spam', 'details' => 'Mensajes repetidos.',
        ])->assertCreated();
        $this->actingAs($other, 'web')->getJson('/portal/reports')->assertForbidden();
        $this->assertDatabaseHas('portal_reports', [
            'target_type' => 'thread', 'target_id' => $threadId, 'status' => 'open',
        ]);
    }


    public function test_registration_rejects_honeypot_data_without_creating_a_user(): void
    {
        $this->postJson('/portal/register', [
            'username' => 'SpamBot42',
            'email' => 'spambot42@example.test',
            'password' => 'strong-password-123',
            'password_confirmation' => 'strong-password-123',
            'website' => 'https://automated-submit.invalid',
        ])->assertUnprocessable();

        $this->assertDatabaseMissing('users', ['username' => 'SpamBot42']);
    }

    public function test_registration_rejects_bursts_by_ip(): void
    {
        $payload = [
            'username' => 'BurstUser',
            'email' => 'burstuser@example.test',
            'password' => 'short',
            'password_confirmation' => 'short',
        ];
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->postJson('/portal/register', $payload)->assertUnprocessable();
        }
        $this->postJson('/portal/register', $payload)->assertStatus(429);
        $this->assertDatabaseMissing('users', ['username' => 'BurstUser']);
    }

    public function test_login_has_account_throttling_in_addition_to_ip_limiting(): void
    {
        $user = $this->player('LoginLimit');
        $payload = [
            'username' => $user->username,
            'password' => 'incorrect-password',
        ];
        for ($attempt = 0; $attempt < 6; $attempt++) {
            $this->postJson('/portal/login', $payload)->assertUnprocessable();
        }
        $this->postJson('/portal/login', $payload)->assertStatus(429);
    }

    public function test_password_recovery_rejects_repeated_requests(): void
    {
        Notification::fake();
        config()->set('services.portal.frontend_url', 'http://localhost:8001');
        $payload = ['email' => 'unknown@example.test'];
        for ($attempt = 0; $attempt < 3; $attempt++) {
            $this->postJson('/portal/forgot-password', $payload)->assertOk();
        }
        $this->postJson('/portal/forgot-password', $payload)->assertStatus(429);
        Notification::assertNothingSent();
    }


    public function test_new_portal_registration_requires_email_confirmation_before_social_writes(): void
    {
        Notification::fake();
        config()->set('services.portal.frontend_url', 'http://localhost:8001');

        $this->postJson('/portal/register', [
            'username' => 'VerifyNew',
            'email' => 'verifynew@example.test',
            'password' => 'strong-pass-123',
            'password_confirmation' => 'strong-pass-123',
            'website' => '',
        ])->assertCreated()
            ->assertJsonPath('authenticated', true)
            ->assertJsonPath('user.email_verified', false)
            ->assertJsonPath('user.email_verification_required', true);

        $user = User::query()->where('username', 'VerifyNew')->firstOrFail();
        $this->assertNotNull($user->portal_email_verification_required_at);
        $this->assertNull($user->email_verified_at);
        Notification::assertSentTo($user, PortalEmailVerificationNotification::class);

        $this->postJson('/portal/forum/threads', [
            'title' => 'No autorizado', 'body' => 'Esta publicación debe bloquearse.',
        ])->assertForbidden()->assertJsonPath('code', 'email_verification_required');
        $this->postJson('/portal/friends', ['username' => 'OtroJugador'])
            ->assertForbidden()->assertJsonPath('code', 'email_verification_required');

        $email = Notification::sent($user, PortalEmailVerificationNotification::class)->first();
        $this->assertStringContainsString('/portal/verify-email/', $email->url);
        $this->assertStringContainsString('signature=', $email->url);

        $this->getJson($email->url)->assertOk()->assertJsonStructure(['message']);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->getJson('/portal/session')->assertOk()
            ->assertJsonPath('user.email_verified', true);
        // This endpoint shares the verification gate but has no unrelated
        // posting rate limit, so it tests the gate instead of limiter state.
        $this->getJson('/portal/friends')->assertOk();
    }

    public function test_email_verification_rejects_tampered_and_expired_signed_links(): void
    {
        Notification::fake();
        $this->postJson('/portal/register', [
            'username' => 'VerifyOld',
            'email' => 'verifyold@example.test',
            'password' => 'strong-pass-123',
            'password_confirmation' => 'strong-pass-123',
        ])->assertCreated();

        $user = User::query()->where('username', 'VerifyOld')->firstOrFail();
        $email = Notification::sent($user, PortalEmailVerificationNotification::class)->first();
        $this->getJson(str_replace('signature=', 'signature=invalid', $email->url))
            ->assertForbidden();
        $expired = URL::temporarySignedRoute('portal.verify-email', now()->subMinute(), [
            'id' => $user->id,
            'hash' => sha1($user->email),
        ]);
        $this->getJson($expired)->assertForbidden();
        $wrongEmailHash = URL::temporarySignedRoute('portal.verify-email', now()->addMinutes(5), [
            'id' => $user->id,
            'hash' => sha1('wrong@example.test'),
        ]);
        $this->getJson($wrongEmailHash)->assertForbidden();
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_unverified_user_can_resend_email_but_not_spam_resend_or_escape_with_login(): void
    {
        Notification::fake();
        $this->postJson('/portal/register', [
            'username' => 'ResendVrfy',
            'email' => 'resendverify@example.test',
            'password' => 'strong-pass-123',
            'password_confirmation' => 'strong-pass-123',
        ])->assertCreated();
        $user = User::query()->where('username', 'ResendVrfy')->firstOrFail();
        Notification::fake();
        $this->postJson('/portal/resend-verification')->assertOk();
        Notification::assertSentTo($user, PortalEmailVerificationNotification::class);
        $this->postJson('/portal/resend-verification')->assertStatus(429);

        $this->postJson('/portal/logout')->assertOk();
        $this->postJson('/portal/login', [
            'username' => 'ResendVrfy',
            'password' => 'strong-pass-123',
        ])->assertOk()->assertJsonPath('user.email_verified', false);
        $this->postJson('/portal/chat', [
            'body' => 'No publicar antes de confirmar',
        ])->assertForbidden()->assertJsonPath('code', 'email_verification_required');
    }

    public function test_existing_game_accounts_are_not_locked_out_by_portal_migration(): void
    {
        $legacy = $this->player('LegacyPortal');
        $this->assertNull($legacy->portal_email_verification_required_at);
        $this->actingAs($legacy, 'web')->postJson('/portal/forum/threads', [
            'title' => 'Usuario antiguo',
            'body' => 'La actualización no debe bloquear usuarios existentes.',
        ])->assertCreated();
    }


    public function test_production_registration_stays_closed_without_real_email_and_https(): void
    {
        $oldEnvironment = $this->app->environment();
        $oldAppUrl = config('app.url');
        $oldFrontend = config('services.portal.frontend_url');
        $oldMailer = config('mail.default');

        try {
            $this->app->instance('env', 'production');
            config()->set('mail.default', 'log');
            config()->set('app.url', 'http://localhost:8000');
            config()->set('services.portal.frontend_url', 'http://localhost:8001');

            $this->postJson('/portal/register', [
                'username' => 'NoMailProd',
                'email' => 'nomailprod@example.test',
                'password' => 'strong-pass-123',
                'password_confirmation' => 'strong-pass-123',
            ])->assertStatus(503);
            $this->assertDatabaseMissing('users', ['username' => 'NoMailProd']);
        } finally {
            $this->app->instance('env', $oldEnvironment);
            config()->set('mail.default', $oldMailer);
            config()->set('app.url', $oldAppUrl);
            config()->set('services.portal.frontend_url', $oldFrontend);
        }
    }

    public function test_game_count_is_null_when_not_configured(): void
    {
        config()->set('services.portal_stats.token', null);
        $this->getJson('/portal/status')->assertOk()->assertJsonPath('game_online_count', null);
    }
}
