<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\CatalogItem;
use App\Models\MinigameScore;
use App\Models\MinigameWeek;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class PortalContentController extends Controller
{
    public function news(): JsonResponse
    {
        $items = DB::table('portal_news')
            ->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->orderByDesc('published_at')
            ->limit(30)
            ->get(['id', 'title', 'body', 'published_at']);

        return response()->json(['items' => $items]);
    }

    public function publish(Request $request): JsonResponse
    {
        abort_unless(PortalAuthController::isStaff($request->user('web')), 403);
        $data = $request->validate([
            'title' => ['required', 'string', 'min:5', 'max:120'],
            'body' => ['required', 'string', 'min:20', 'max:10000'],
        ]);
        $id = DB::table('portal_news')->insertGetId([
            'user_id' => $request->user('web')->id,
            'title' => trim($data['title']),
            'body' => trim($data['body']),
            'published_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        return response()->json(['id' => $id, 'message' => 'Noticia publicada.'], 201);
    }

    public function removeNews(Request $request, int $id): JsonResponse
    {
        abort_unless(PortalAuthController::isStaff($request->user('web')), 403);
        DB::table('portal_news')->where('id', $id)->delete();
        return response()->json(['message' => 'Noticia eliminada.']);
    }

    public function catalog(): JsonResponse
    {
        // Read-only catalogue: no browser-side purchase or Stripe calls.
        $items = CatalogItem::query()
            ->with('category')
            ->where('is_active', true)
            ->where('is_purchasable', true)
            ->orderByDesc('id')
            ->limit(60)
            ->get();

        return response()->json([
            'items' => $items->map(fn (CatalogItem $item) => [
                'id' => $item->id,
                'name' => (string) $item->name,
                'description' => (string) ($item->description ?? ''),
                'category' => (string) ($item->category?->name ?? 'Otros'),
                'price' => $item->price,
                'price_type' => $item->price_type,
            ])->values(),
            'purchases_enabled' => false,
        ]);
    }

    public function ranking(): JsonResponse
    {
        $week = MinigameWeek::with('minigame')
            ->orderByDesc('year')->orderByDesc('week_number')->first();
        if (!$week) {
            return response()->json(['week' => null, 'items' => []]);
        }
        // Respect the game's opt-out setting, and exclude bots.
        $scores = MinigameScore::query()
            ->join('users', 'users.id', '=', 'minigame_scores.user_id')
            ->where('minigame_scores.minigame_week_id', $week->id)
            ->where('users.show_username', true)
            ->where('users.is_bot', false)
            ->orderByDesc('minigame_scores.score')
            ->orderBy('minigame_scores.created_at')
            ->limit(20)
            ->get(['users.username', 'minigame_scores.score']);

        return response()->json([
            'week' => [
                'number' => $week->week_number,
                'year' => $week->year,
                'game' => (string) ($week->minigame?->name ?? 'Minijuego'),
            ],
            'items' => $scores->values()->map(fn ($score, $i) => [
                'position' => $i + 1,
                'username' => $score->username,
                'score' => $score->score,
            ]),
        ]);
    }

    public function status(): JsonResponse
    {
        // The count represents recent activity in the portal, never game-server connections.
        $online = null;
        $host = config('services.portal_stats.url');
        $token = config('services.portal_stats.token');
        if ($host && $token) {
            try {
                $response = Http::timeout(2)
                    ->withHeaders(['X-Portal-Stats-Token' => $token])
                    ->get(rtrim($host, '/') . '/internal/portal-stats');
                if ($response->ok() && is_int($response->json('online_players'))) {
                    $online = max(0, $response->json('online_players'));
                }
            } catch (\Throwable $e) {
                // The game may be offline; don't fabricate a zero or leak internal details.
            }
        }

        return response()->json([
            'portal_active_last_5_minutes' => DB::table('portal_presence')
                ->where('last_seen_at', '>=', now()->subMinutes(5))
                ->count(),
            'game_online_count' => $online,
            'as_of' => now()->toIso8601String(),
        ])->header('Cache-Control', 'no-store');
    }

    public function pulse(Request $request): JsonResponse
    {
        $user = $request->user('web');
        abort_unless((bool) $user->active, 403);
        DB::table('portal_presence')->updateOrInsert(
            ['user_id' => $user->id],
            ['last_seen_at' => now()]
        );
        return response()->json(['ok' => true]);
    }
}
