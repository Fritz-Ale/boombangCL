<?php

namespace App\Console\Commands;

use App\Models\CatalogItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Importa archivos proporcionados localmente por su titular o licenciatario.
 * No descarga material de BoomBang.tv ni activa ventas automáticamente.
 */
class ImportLicensedCatalogArt extends Command
{
    protected $signature = 'catalog:import-art
        {manifest : Ruta local a un JSON de imágenes autorizadas}
        {--dry-run : Validar sin copiar archivos ni modificar la base de datos}';

    protected $description = 'Incorpora imágenes y atlas autorizados a objetos ya existentes del catálogo';

    public function handle(): int
    {
        $manifest = realpath((string) $this->argument('manifest'));
        if (!$manifest || !is_file($manifest)) {
            $this->error('No existe el manifiesto indicado.');
            return self::FAILURE;
        }

        $root = dirname($manifest);
        try {
            $document = json_decode(file_get_contents($manifest), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($document) || !isset($document['items']) ||
                !is_array($document['items']) || !array_is_list($document['items'])) {
                throw new \InvalidArgumentException('Se requiere un array items.');
            }

            // Validar todos los archivos antes de efectuar cualquier modificación.
            $validated = [];
            $seen = [];
            foreach ($document['items'] as $entry) {
                if (!is_array($entry) || !is_string($entry['sprite_name'] ?? null) ||
                    !preg_match('/^[a-zA-Z0-9_-]{1,100}$/', $entry['sprite_name'])) {
                    throw new \InvalidArgumentException('Cada objeto necesita un sprite_name válido.');
                }
                $key = $entry['sprite_name'];
                if (isset($seen[$key])) {
                    throw new \InvalidArgumentException("El objeto {$key} está duplicado.");
                }
                $seen[$key] = true;

                $rights = $entry['rights_status'] ?? null;
                $rightsEvidence = trim((string) ($entry['rights_evidence'] ?? ''));
                if (mb_strlen($rightsEvidence) < 8) {
                    throw new \InvalidArgumentException("El objeto {$key} requiere evidencia documental de derechos.");
                }
                if (!in_array($rights, ['original', 'licensed'], true)) {
                    throw new \InvalidArgumentException("Debe declarar derechos válidos para {$key}.");
                }
                $item = CatalogItem::where('sprite_name', $key)->first();
                if (!$item) {
                    throw new \InvalidArgumentException("El objeto {$key} no existe. Cree primero su ficha.");
                }

                $files = ['image' => $this->validatedPath($root, $entry['image'] ?? null, false)];
                foreach (['spreadsheet', 'atlas'] as $field) {
                    if (isset($entry[$field])) {
                        $files[$field] = $this->validatedPath($root, $entry[$field], $field === 'atlas');
                    }
                }
                if (isset($files['spreadsheet']) !== isset($files['atlas'])) {
                    throw new \InvalidArgumentException("{$key} requiere atlas y spreadsheet juntos.");
                }

                // Las dimensiones de una miniatura no tienen por qué coincidir
                // con el sprite renderizado en Phaser.
                $renderTexture = $files['spreadsheet'] ?? $files['image'];
                [$textureWidth, $textureHeight] = getimagesize($renderTexture);
                if (isset($files['atlas'])) {
                    // Una hoja de atlas no equivale al tamaño de un fotograma.
                    // Exigir las dimensiones de ese objeto al importador.
                    if (!isset($entry['width'], $entry['height'])) {
                        throw new \InvalidArgumentException("{$key}: un atlas requiere width y height explícitos del sprite.");
                    }
                }
                $width = $entry['width'] ?? $textureWidth;
                $height = $entry['height'] ?? $textureHeight;
                $scale = $entry['scale'] ?? 1;
                foreach (['width' => $width, 'height' => $height] as $name => $value) {
                    if (!is_int($value) || $value < 1 || $value > 10000) {
                        throw new \InvalidArgumentException("{$key}: {$name} debe ser un entero positivo.");
                    }
                }
                if (!is_int($scale) && !is_float($scale) ||
                    !is_finite((float) $scale) || $scale < 0.05 || $scale > 8) {
                    throw new \InvalidArgumentException("{$key}: scale debe estar entre 0.05 y 8.");
                }

                $tiles = $entry['map_size'] ?? [[0, 0]];
                if (!is_array($tiles) || count($tiles) < 1 || count($tiles) > 256) {
                    throw new \InvalidArgumentException("{$key}: huella del mapa inválida.");
                }
                $unique = [];
                foreach ($tiles as $tile) {
                    if (!is_array($tile) || count($tile) !== 2 ||
                        !isset($tile[0], $tile[1]) ||
                        !is_int($tile[0]) || !is_int($tile[1]) ||
                        $tile[0] < 0 || $tile[1] < 0) {
                        throw new \InvalidArgumentException("{$key}: cada casilla debe ser [x,y] con enteros >= 0.");
                    }
                    $unique[$tile[0] . ',' . $tile[1]] = true;
                }
                if (count($unique) !== count($tiles)) {
                    throw new \InvalidArgumentException("{$key}: hay casillas repetidas.");
                }

                $validated[] = compact('item', 'key', 'rights', 'rightsEvidence', 'files', 'width', 'height', 'scale', 'tiles');
            }

            if ($this->option('dry-run')) {
                $this->info('Validación aprobada: ' . count($validated) . ' objetos. No se han cambiado archivos ni BD.');
                return self::SUCCESS;
            }

            foreach ($validated as $entry) {
                DB::transaction(function () use ($entry): void {
                    $item = $entry['item'];
                    foreach ($entry['files'] as $field => $source) {
                        // Ruta determinista evita colisiones y conserva el archivo original.
                        $extension = strtolower(pathinfo($source, PATHINFO_EXTENSION));
                        $target = 'uploads/catalog/approved/' . $item->id . '/' .
                            hash_file('sha256', $source) . '.' . $extension;
                        if (!Storage::disk('uploads')->put($target, file_get_contents($source))) {
                            throw new \RuntimeException("No se pudo copiar {$source}.");
                        }
                        $item->{$field} = $target;
                    }

                    $item->width = $entry['width'];
                    $item->height = $entry['height'];
                    $item->scale = $entry['scale'];
                    $item->map_size = json_encode($entry['tiles'], JSON_THROW_ON_ERROR);
                    $item->asset_rights_status = $entry['rights'];
                    $item->asset_rights_evidence = $entry['rightsEvidence'];
                    $item->is_reference_only = false;
                    // La publicación y venta quedan bajo control del administrador.
                    $item->is_active = false;
                    $item->is_purchasable = false;
                    $item->save();
                });
                $this->info("Importado {$entry['key']} (sin activar ni vender).");
            }

            $this->info('Importación finalizada: ' . count($validated) . ' objetos.');
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }
    }

    private function validatedPath(string $root, mixed $relative, bool $isAtlas): string
    {
        if (!is_string($relative) || $relative === '' ||
            str_starts_with($relative, '/') || str_contains($relative, "\0")) {
            throw new \InvalidArgumentException('Las rutas de recursos deben ser relativas al manifiesto.');
        }
        $resolved = realpath($root . DIRECTORY_SEPARATOR . $relative);
        if (!$resolved || !str_starts_with($resolved, $root . DIRECTORY_SEPARATOR) ||
            !is_file($resolved) || filesize($resolved) > 12 * 1024 * 1024) {
            throw new \InvalidArgumentException("Recurso inválido o fuera de la carpeta: {$relative}");
        }

        $extension = strtolower(pathinfo($resolved, PATHINFO_EXTENSION));
        if ($isAtlas) {
            if ($extension !== 'json') {
                throw new \InvalidArgumentException('Un atlas debe ser JSON.');
            }
            $atlas = json_decode(file_get_contents($resolved), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($atlas) || empty($atlas['frames']) || !is_array($atlas['frames'])) {
                throw new \InvalidArgumentException('El atlas no contiene frames.');
            }
        } else {
            $size = @getimagesize($resolved);
            if (!in_array($extension, ['png', 'webp'], true) ||
                !$size || !in_array($size['mime'], ['image/png', 'image/webp'], true)) {
                throw new \InvalidArgumentException('Solo se admiten imágenes PNG o WebP válidas.');
            }
        }
        return $resolved;
    }
}
