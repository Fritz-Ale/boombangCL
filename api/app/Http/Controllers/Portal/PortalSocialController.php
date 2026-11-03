<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PortalSocialController extends Controller
{
    private function current(Request $request): User
    {
        $user = $request->user('web');
        abort_unless($user && $user->active && !$user->is_bot, 403);
        return $user;
    }

    private function publicUser(int $id): string
    {
        $user = User::query()->find($id, ['id', 'username', 'show_username']);
        return $user && $user->show_username ? $user->username : 'Usuario';
    }

    private function destination(string $username, int $fromId): User
    {
        $target = User::query()->where('username', $username)
            ->where('show_username', true)
            ->where('active', true)->where('is_bot', false)->first();
        if (!$target || $target->id === $fromId) {
            throw ValidationException::withMessages(['username' => 'No se encontró ese usuario o no está disponible.']);
        }
        return $target;
    }

    public function friendships(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $records = DB::table('portal_friendships')
            ->where('user_low_id', $user->id)->orWhere('user_high_id', $user->id)
            ->orderByDesc('updated_at')->limit(150)->get();
        $result = $records->map(function ($record) use ($user) {
            $other = $record->user_low_id === $user->id ? $record->user_high_id : $record->user_low_id;
            return [
                'id' => $record->id,
                'username' => $this->publicUser((int) $other),
                'status' => $record->status,
                'direction' => $record->requested_by === $user->id ? 'sent' : 'received',
            ];
        });
        return response()->json(['items' => $result]);
    }

    public function requestFriend(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $data = $request->validate(['username' => ['required', 'string', 'max:10']]);
        $other = $this->destination($data['username'], $user->id);
        $low = min($user->id, $other->id);
        $high = max($user->id, $other->id);
        $exists = DB::table('portal_friendships')
            ->where('user_low_id', $low)->where('user_high_id', $high)->exists();
        if ($exists) throw ValidationException::withMessages(['username' => 'Ya existe una solicitud o amistad entre ambos.']);
        DB::table('portal_friendships')->insert([
            'user_low_id' => $low, 'user_high_id' => $high,
            'requested_by' => $user->id, 'status' => 'pending',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return response()->json(['message' => 'Solicitud enviada.'], 201);
    }

    public function acceptFriend(Request $request, int $id): JsonResponse
    {
        $user = $this->current($request);
        $count = DB::table('portal_friendships')->where('id', $id)
            ->where('status', 'pending')->where('requested_by', '!=', $user->id)
            ->where(fn ($query) => $query->where('user_low_id', $user->id)->orWhere('user_high_id', $user->id))
            ->update(['status' => 'accepted', 'updated_at' => now()]);
        abort_unless($count, 404);
        return response()->json(['message' => 'Amistad confirmada.']);
    }

    public function removeFriend(Request $request, int $id): JsonResponse
    {
        $user = $this->current($request);
        $count = DB::table('portal_friendships')->where('id', $id)
            ->where(fn ($query) => $query->where('user_low_id', $user->id)->orWhere('user_high_id', $user->id))
            ->delete();
        abort_unless($count, 404);
        return response()->json(['message' => 'Solicitud o amistad eliminada.']);
    }

    public function clan(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $membership = DB::table('portal_clan_members')->where('user_id', $user->id)->first();
        $clan = $membership ? DB::table('portal_clans')->where('id', $membership->clan_id)->first() : null;
        $members = $clan
            ? DB::table('portal_clan_members')->where('clan_id', $clan->id)->orderBy('id')->limit(100)->get()
            : collect();
        $invites = DB::table('portal_clan_invites as i')
            ->join('portal_clans as c', 'c.id', '=', 'i.clan_id')
            ->where('i.user_id', $user->id)->orderByDesc('i.id')->limit(30)
            ->get(['i.id', 'c.name', 'i.clan_id']);
        return response()->json([
            'clan' => $clan ? [
                'id' => $clan->id, 'name' => $clan->name,
                'description' => $clan->description, 'owner' => $clan->owner_id === $user->id,
                'members' => $members->map(fn ($m) => ['username' => $this->publicUser((int) $m->user_id)]),
            ] : null,
            'invites' => $invites,
        ]);
    }

    public function createClan(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:40', 'regex:/^[\pL\pN _-]+$/u', 'unique:portal_clans,name'],
            'description' => ['nullable', 'string', 'max:500'],
        ]);
        // Lock the user record so concurrent requests cannot create multiple clans.
        $id = DB::transaction(function () use ($user, $data) {
            DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
            if (DB::table('portal_clan_members')->where('user_id', $user->id)->exists()) {
                throw ValidationException::withMessages(['name' => 'Ya perteneces a un clan.']);
            }
            $id = DB::table('portal_clans')->insertGetId([
                'owner_id' => $user->id, 'name' => trim($data['name']),
                'description' => trim($data['description'] ?? ''),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('portal_clan_members')->insert([
                'clan_id' => $id, 'user_id' => $user->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
            return $id;
        });
        return response()->json(['id' => $id, 'message' => 'Clan creado.'], 201);
    }

    public function invite(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $data = $request->validate(['username' => ['required', 'string', 'max:10']]);
        $clan = DB::table('portal_clans')->where('owner_id', $user->id)->first();
        abort_unless($clan, 403);
        $other = $this->destination($data['username'], $user->id);
        if (DB::table('portal_clan_members')->where('user_id', $other->id)->exists()) {
            throw ValidationException::withMessages(['username' => 'Ese usuario ya pertenece a otro clan.']);
        }
        $already = DB::table('portal_clan_invites')->where('clan_id', $clan->id)->where('user_id', $other->id)->exists();
        if ($already) throw ValidationException::withMessages(['username' => 'La invitación ya está pendiente.']);
        DB::table('portal_clan_invites')->insert([
            'clan_id' => $clan->id, 'user_id' => $other->id, 'invited_by' => $user->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return response()->json(['message' => 'Invitación enviada.'], 201);
    }

    public function respondInvite(Request $request, int $id): JsonResponse
    {
        $user = $this->current($request);
        $data = $request->validate(['accept' => ['required', 'boolean']]);
        DB::transaction(function () use ($user, $id, $data) {
            DB::table('users')->where('id', $user->id)->lockForUpdate()->first();
            $invite = DB::table('portal_clan_invites')->where('id', $id)->where('user_id', $user->id)->lockForUpdate()->first();
            abort_unless($invite, 404);
            if ($data['accept']) {
                if (DB::table('portal_clan_members')->where('user_id', $user->id)->exists()) {
                    throw ValidationException::withMessages(['accept' => 'Sal de tu clan actual antes de aceptar.']);
                }
                DB::table('portal_clan_members')->insert([
                    'clan_id' => $invite->clan_id, 'user_id' => $user->id,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                DB::table('portal_clan_invites')->where('user_id', $user->id)->delete();
            } else {
                DB::table('portal_clan_invites')->where('id', $id)->delete();
            }
        });
        return response()->json(['message' => $data['accept'] ? 'Te uniste al clan.' : 'Invitación rechazada.']);
    }

    public function leaveClan(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $member = DB::table('portal_clan_members')->where('user_id', $user->id)->first();
        abort_unless($member, 404);
        $clan = DB::table('portal_clans')->where('id', $member->clan_id)->first();
        if ($clan && (int) $clan->owner_id === $user->id) {
            throw ValidationException::withMessages(['clan' => 'El creador debe disolver el clan para salir.']);
        }
        DB::table('portal_clan_members')->where('user_id', $user->id)->delete();
        return response()->json(['message' => 'Saliste del clan.']);
    }

    public function disbandClan(Request $request): JsonResponse
    {
        $user = $this->current($request);
        $count = DB::table('portal_clans')->where('owner_id', $user->id)->delete();
        abort_unless($count, 404);
        return response()->json(['message' => 'Clan disuelto.']);
    }
}
