<?php

namespace App\Console\Commands;

use App\Support\PublicSceneAssetInspector;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class AuditPublicSceneAssets extends Command
{
    protected $signature = 'game:audit-public-scene-assets {--scene= : ID de la sala, por ejemplo UFO=1}';
    protected $description = 'Comprueba fondos de áreas públicas en el almacenamiento realmente servido por Laravel (solo lectura)';

    public function handle(): int
    {
        $sceneId = $this->option('scene');
        if ($sceneId !== null && (!ctype_digit((string) $sceneId) || (int) $sceneId < 1)) {
            $this->error('El identificador de sala debe ser un entero positivo.');
            return self::FAILURE;
        }

        $query = DB::table('public_scenes')->select('id', 'name', 'assets_data', 'active');
        if ($sceneId !== null) {
            $query->where('id', (int) $sceneId);
        } else {
            $query->where('active', 1);
        }

        $scenes = $query->orderBy('id')->get();
        if ($scenes->isEmpty()) {
            $this->error('No hay salas que inspeccionar. Comprueba la base de datos y el seed.');
            return self::FAILURE;
        }

        $root = public_path();
        $apiUrl = rtrim((string) config('app.url'), '/');
        $this->line('APP_URL: ' . ($apiUrl ?: '[no configurada]'));
        $this->line('Laravel public/: ' . $root);

        $issues = 0;
        foreach ($scenes as $scene) {
            $items = PublicSceneAssetInspector::inspect($scene->assets_data, $root);
            $this->info(sprintf('Área %d (%s): %d fondo(s) referenciado(s)', $scene->id, $scene->name, count($items)));

            if (count($items) === 0) {
                $this->warn('  SIN FONDOS: el registro no contiene assets_data de fondo.');
                $issues++;
            }

            foreach ($items as $asset) {
                $status = $asset['status'];
                $label = sprintf('  [%s] %s', strtoupper($status), $asset['path'] ?: '[ruta vacía]');
                $this->line($label);
                if ($status === 'ok' && $apiUrl) {
                    $this->line('    Verificar en navegador: ' . $apiUrl . '/' . ltrim($asset['path'], '/'));
                } elseif ($status !== 'ok') {
                    $issues++;
                }
            }
        }

        if ($issues > 0) {
            $this->error(sprintf('%d incidencia(s). Sin modificaciones en MySQL ni los archivos.', $issues));
            return self::FAILURE;
        }

        $this->info('Fondos locales presentes y legibles. Falta comprobar HTTP, CORS y Phaser desde el navegador.');
        return self::SUCCESS;
    }
}
