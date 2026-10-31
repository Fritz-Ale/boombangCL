<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PortalAuthController extends Controller
{
    public static function isStaff(?User $user): bool
    {
        return $user !== null && (
            $user->hasRole('Admin', 'admin') ||
            $user->hasRole('Superadmin', 'superadmin')
        );
    }

    private function snapshot(Request $request): array
    {
        $user = Auth::guard('web')->user();

        return [
            'csrf' => $request->session()->token(),
            'authenticated' => $user !== null && (bool) $user->active,
            'user' => $user && $user->active ? [
                'id' => $user->id,
                'username' => $user->username,
                'is_staff' => self::isStaff($user),
            ] : null,
        ];
    }

    public function session(Request $request): JsonResponse
    {
        return response()->json($this->snapshot($request))
            ->header('Cache-Control', 'no-store');
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'regex:/^[A-Za-z0-9_]{3,10}$/', 'unique:users,username'],
            'email' => ['required', 'email', 'max:254', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(10)],
            'website' => ['nullable', 'size:0'], // Honeypot, in addition to CSRF and throttling.
        ]);
        $user = DB::transaction(fn () => User::create([
            'username' => $data['username'],
            'name' => $data['username'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'avatar' => 1,
            'lang' => 'es',
            'description' => '',
        ]));
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        return response()->json($this->snapshot($request), 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:100'],
            'password' => ['required', 'string'],
        ]);
        if (!Auth::guard('web')->attempt([
            'username' => $data['username'],
            'password' => $data['password'],
            'active' => true,
        ])) {
            return response()->json(['message' => 'Usuario o contraseña incorrectos.'], 422);
        }

        $request->session()->regenerate();
        return response()->json($this->snapshot($request));
    }

    public function logout(Request $request): JsonResponse
    {
        $user = Auth::guard('web')->user();
        if ($user) {
            DB::table('portal_presence')->where('user_id', $user->id)->delete();
        }
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json($this->snapshot($request));
    }
}
