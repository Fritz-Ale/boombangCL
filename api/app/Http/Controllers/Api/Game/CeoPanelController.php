<?php
namespace App\Http\Controllers\Api\Game;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Island;
use App\Models\PublicScene;
use Illuminate\Http\Request;

class CeoPanelController extends Controller
{
    public function status(Request $request)
    {
        $user = $request->user();
        if (!$user || !$user->hasRole('Superadmin')) {
            abort(403, 'Solo Superadmin puede acceder al panel CEO.');
        }

        return response()->json([
            'authorized' => true,
            'users_total' => User::count(),
            'islands_total' => Island::count(),
            'public_scenes_total' => PublicScene::count(),
            'admin_url' => url(config('backpack.base.route_prefix', 'admin')),
        ]);
    }
}
