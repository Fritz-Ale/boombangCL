<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class PortalFeatureTest extends TestCase
{
    use DatabaseTransactions;

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

    public function test_game_count_is_null_when_not_configured(): void
    {
        config()->set('services.portal_stats.token', null);
        $this->getJson('/portal/status')->assertOk()->assertJsonPath('game_online_count', null);
    }
}
