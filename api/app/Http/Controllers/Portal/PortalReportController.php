<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PortalReportController extends Controller
{
    private const SOURCES = [
        'thread' => 'portal_threads',
        'reply' => 'portal_replies',
        'chat' => 'portal_chat_messages',
    ];

    public function create(Request $request): JsonResponse
    {
        $user = $request->user('web');
        abort_unless($user && $user->active && !$user->is_bot, 403);

        $data = $request->validate([
            'type' => ['required', 'in:thread,reply,chat'],
            'id' => ['required', 'integer', 'min:1'],
            'reason' => ['required', 'in:spam,harassment,personal_data,inappropriate,other'],
            'details' => ['nullable', 'string', 'max:500'],
        ]);
        $table = self::SOURCES[$data['type']];
        abort_unless(DB::table($table)->where('id', $data['id'])->exists(), 404);
        $duplicate = DB::table('portal_reports')
            ->where('reporter_id', $user->id)
            ->where('target_type', $data['type'])
            ->where('target_id', $data['id'])
            ->where('created_at', '>=', now()->subDay())->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['id' => 'Ya reportaste ese contenido recientemente.']);
        }
        DB::table('portal_reports')->insert([
            'reporter_id' => $user->id, 'target_type' => $data['type'],
            'target_id' => $data['id'], 'reason' => $data['reason'],
            'details' => trim($data['details'] ?? ''),
            'status' => 'open', 'created_at' => now(), 'updated_at' => now(),
        ]);
        return response()->json(['message' => 'Reporte recibido para revisión.'], 201);
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless(PortalAuthController::isStaff($request->user('web')), 403);
        $status = $request->validate(['status' => ['nullable', 'in:open,reviewed,dismissed']])['status'] ?? 'open';
        return response()->json([
            'items' => DB::table('portal_reports')->where('status', $status)
                ->orderBy('id')->limit(100)
                ->get(['id', 'reporter_id', 'target_type', 'target_id',
                    'reason', 'details', 'status', 'created_at']),
        ]);
    }

    public function review(Request $request, int $id): JsonResponse
    {
        abort_unless(PortalAuthController::isStaff($request->user('web')), 403);
        $data = $request->validate(['status' => ['required', 'in:reviewed,dismissed']]);
        $count = DB::table('portal_reports')->where('id', $id)->where('status', 'open')
            ->update([
                'status' => $data['status'],
                'reviewed_by' => $request->user('web')->id,
                'reviewed_at' => now(), 'updated_at' => now(),
            ]);
        abort_unless($count, 404);
        return response()->json(['message' => 'Reporte revisado.']);
    }
}
