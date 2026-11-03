<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PortalCommunityController extends Controller
{
    private function activeUser(Request $request)
    {
        $user = $request->user('web');
        abort_unless($user && $user->active, 403);
        return $user;
    }

    public function threads(Request $request): JsonResponse
    {
        $data = $request->validate(['page' => ['nullable', 'integer', 'min:1', 'max:1000']]);
        $page = (int) ($data['page'] ?? 1);
        $query = DB::table('portal_threads as t')
            ->join('users as u', 'u.id', '=', 't.user_id');
        $total = (clone $query)->count();
        $items = $query->orderByDesc('t.updated_at')->orderByDesc('t.id')
            ->offset(($page - 1) * 20)->limit(20)
            ->get(['t.id', 't.title', 't.body', 't.is_locked', 't.created_at', 'u.username', 'u.show_username']);
        return response()->json([
            'items' => $items->map(fn ($item) => [
                'id' => $item->id,
                'title' => $item->title,
                'body' => $item->body,
                'author' => $item->show_username ? $item->username : 'Usuario',
                'locked' => (bool) $item->is_locked,
                'created_at' => $item->created_at,
            ]),
            'page' => $page,
            'has_more' => $total > $page * 20,
        ]);
    }

    public function thread(int $id): JsonResponse
    {
        $thread = DB::table('portal_threads as t')
            ->join('users as u', 'u.id', '=', 't.user_id')
            ->where('t.id', $id)
            ->first(['t.id', 't.title', 't.body', 't.is_locked', 't.created_at', 'u.username', 'u.show_username']);
        abort_unless($thread, 404);
        $replies = DB::table('portal_replies as r')
            ->join('users as u', 'u.id', '=', 'r.user_id')
            ->where('r.thread_id', $id)
            ->orderBy('r.id')->limit(100)
            ->get(['r.id', 'r.body', 'r.created_at', 'u.username', 'u.show_username']);
        return response()->json([
            'thread' => [
                'id' => $thread->id,
                'title' => $thread->title,
                'body' => $thread->body,
                'locked' => (bool) $thread->is_locked,
                'author' => $thread->show_username ? $thread->username : 'Usuario',
                'created_at' => $thread->created_at,
            ],
            'replies' => $replies->map(fn ($reply) => [
                'id' => $reply->id,
                'body' => $reply->body,
                'author' => $reply->show_username ? $reply->username : 'Usuario',
                'created_at' => $reply->created_at,
            ]),
            'truncated' => DB::table('portal_replies')->where('thread_id', $id)->count() > 100,
        ]);
    }

    public function createThread(Request $request): JsonResponse
    {
        $user = $this->activeUser($request);
        $data = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:120'],
            'body' => ['required', 'string', 'min:10', 'max:2000'],
        ]);
        $id = DB::table('portal_threads')->insertGetId([
            'user_id' => $user->id,
            'title' => trim($data['title']),
            'body' => trim($data['body']),
            'is_locked' => false,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return response()->json(['id' => $id], 201);
    }

    public function reply(Request $request, int $id): JsonResponse
    {
        $user = $this->activeUser($request);
        $data = $request->validate(['body' => ['required', 'string', 'min:2', 'max:2000']]);
        DB::transaction(function () use ($user, $id, $data) {
            $thread = DB::table('portal_threads')->where('id', $id)->lockForUpdate()->first();
            abort_unless($thread, 404);
            if ($thread->is_locked) {
                throw ValidationException::withMessages(['body' => 'Este tema está cerrado.']);
            }
            DB::table('portal_replies')->insert([
                'thread_id' => $id, 'user_id' => $user->id,
                'body' => trim($data['body']),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            DB::table('portal_threads')->where('id', $id)->update(['updated_at' => now()]);
        });
        return response()->json(['message' => 'Respuesta publicada.'], 201);
    }

    public function removeThread(Request $request, int $id): JsonResponse
    {
        $user = $this->activeUser($request);
        $thread = DB::table('portal_threads')->where('id', $id)->first();
        abort_unless($thread, 404);
        abort_unless((int) $thread->user_id === $user->id ||
            PortalAuthController::isStaff($user), 403);
        DB::table('portal_threads')->where('id', $id)->delete();
        return response()->json(['message' => 'Tema eliminado.']);
    }

    public function lockThread(Request $request, int $id): JsonResponse
    {
        $user = $this->activeUser($request);
        abort_unless(PortalAuthController::isStaff($user), 403);
        $data = $request->validate(['locked' => ['required', 'boolean']]);
        $updated = DB::table('portal_threads')->where('id', $id)
            ->update(['is_locked' => (bool) $data['locked'], 'updated_at' => now()]);
        abort_unless($updated, 404);
        return response()->json(['message' => 'Estado del tema actualizado.']);
    }

    public function removeReply(Request $request, int $id): JsonResponse
    {
        $user = $this->activeUser($request);
        $reply = DB::table('portal_replies')->where('id', $id)->first();
        abort_unless($reply, 404);
        abort_unless((int) $reply->user_id === (int) $user->id || PortalAuthController::isStaff($user), 403);
        DB::table('portal_replies')->where('id', $id)->delete();
        return response()->json(['message' => 'Respuesta eliminada.']);
    }

    public function removeChat(Request $request, int $id): JsonResponse
    {
        $user = $this->activeUser($request);
        $message = DB::table('portal_chat_messages')->where('id', $id)->first();
        abort_unless($message, 404);
        abort_unless((int) $message->user_id === (int) $user->id || PortalAuthController::isStaff($user), 403);
        DB::table('portal_chat_messages')->where('id', $id)->delete();
        return response()->json(['message' => 'Mensaje eliminado.']);
    }

    public function chat(Request $request): JsonResponse
    {
        $this->activeUser($request);
        $items = DB::table('portal_chat_messages as m')
            ->join('users as u', 'u.id', '=', 'm.user_id')
            ->orderByDesc('m.id')->limit(50)
            ->get(['m.id', 'm.body', 'm.created_at', 'u.username', 'u.show_username']);
        return response()->json(['items' => $items->reverse()->values()->map(fn ($item) => [
            'id' => $item->id,
            'body' => $item->body,
            'author' => $item->show_username ? $item->username : 'Usuario',
            'created_at' => $item->created_at,
        ])]);
    }

    public function sendChat(Request $request): JsonResponse
    {
        $user = $this->activeUser($request);
        $data = $request->validate(['body' => ['required', 'string', 'min:1', 'max:400']]);
        $id = DB::table('portal_chat_messages')->insertGetId([
            'user_id' => $user->id, 'body' => trim($data['body']),
            'created_at' => now(), 'updated_at' => now(),
        ]);
        return response()->json(['id' => $id], 201);
    }
}
