<?php

use Illuminate\Foundation\Console\ClosureCommand;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    /** @var ClosureCommand $this */
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Cola:
 * En producción es mejor un supervisor (supervisor, systemd, etc.).
 * Si quieres mantener el comportamiento anterior, puedes dejar este schedule:
 */
Schedule::command('queue:work --stop-when-empty')
    ->everyMinute()
    ->withoutOverlapping();

/**
 * Procesar minijuegos y eventos (crear semanas, distribuir premios)
 * Se ejecuta cada minuto para asegurar que se procesen los cambios de semana
 */
Schedule::command('boombang:process-games-events')
    ->everyMinute()
    ->withoutOverlapping();


/**
 * Diagnostic only: checks MySQL scene configuration against the public
 * uploads directory *seen by this Laravel process* (including Docker mounts).
 * No database changes, ZIP extraction or remote requests.
 *
 * php artisan boombang:scenes:diagnose --scene=UFO --strict
 * php artisan boombang:scenes:diagnose --json
 */
Artisan::command('boombang:scenes:diagnose {--scene= : ID or exact name} {--json : Machine-readable report} {--strict : Fail when any scene is incomplete}', function () {
    $selected = $this->option('scene');
    try {
        $query = \\App\\Models\\PublicScene::query()->where('active', 1);
        if ($selected !== null && $selected !== '') {
            if (ctype_digit((string) $selected)) {
                $query->where('id', (int) $selected);
            } else {
                $query->where('name', (string) $selected);
            }
        }
        $scenes = $query->get(['id', 'name', 'assets_data']);
    } catch (\\Throwable $exception) {
        $this->error('No se pudieron consultar las áreas públicas. Revisa la conexión MySQL y los logs de Laravel.');
        return 2;
    }

    $report = \\App\\Support\\PublicSceneAssetDiagnostics::inspect($scenes, public_path());
    if ($this->option('json')) {
        $this->line(json_encode($report, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT));
    } else {
        $this->info('Áreas públicas inspeccionadas: ' . $report['scenes_checked']);
        foreach ($report['scenes'] as $scene) {
            $this->line(sprintf(
                '[%s] %s (#%s): fondos %d/%d, recursos %d/%d',
                strtoupper($scene['status']),
                $scene['name'],
                $scene['id'],
                $scene['backgrounds_present'],
                $scene['backgrounds_total'],
                $scene['assets_present'],
                $scene['assets_total']
            ));
            foreach ($scene['issues'] as $issue) {
                $this->warn('  - ' . $issue['code'] . ($issue['path'] !== '' ? ': ' . $issue['path'] : ''));
            }
        }
    }

    // Avoid reporting a false PASS when a scene has no matching DB row.
    if ($report['scenes_checked'] === 0) {
        if (!$this->option('json')) {
            $this->error('No se encontraron áreas públicas para el filtro solicitado.');
        }
        return 2;
    }

    if ($this->option('strict') && $report['scenes_problematic'] > 0) {
        return 1;
    }
    return 0;
})->purpose('Diagnosticar fondos y sprites de áreas públicas sin modificar datos');
