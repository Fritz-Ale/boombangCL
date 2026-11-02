<?php

namespace App\Console\Commands;

use App\Models\CatalogCategory;
use App\Models\CatalogItem;
use App\Support\CatalogRarity;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Throwable;

/**
 * Importa únicamente arte propio o licenciado que ya esté en disco.
 * NO descarga imágenes ni importa colecciones de otros servidores.
 */
class ImportAuthorizedCatalog extends Command
{
    protected $signature = 'catalog:import-authorized
        {manifest : Nombre del JSON ubicado en storage/app/catalog-import}
        {--activate : Publicar artículos en la tienda cuando termine el control de derechos}
        {--dry-run : Verificar sin grabar archivos o artículos}';

    protected $description = 'Importa objetos para las islas desde imágenes autorizadas con dimensiones reales';

    public function handle(): int
    {
        $base = storage_path('app/catalog-import');
        try {
            $manifestPath = $this->safePath($base, (string) $this->argument('manifest'));
            $document = json_decode(file_get_contents($manifestPath), true, 512, JSON_THROW_ON_ERROR);
            if (!is_array($document) || !isset($document['items']) || !is_array($document['items'])) {
                throw new InvalidArgumentException('El manifiesto debe tener un arreglo "items".');
            }

            $validated = [];
            $seen = [];
            foreach ($document['items'] as $entry) {
                if (!is_array($entry)) throw new InvalidArgumentException('Un objeto no tiene estructura válida.');
                $sprite = (string) ($entry['sprite_name'] ?? '');
                if (!preg_match('/^[a-z][a-z0-9_]{2,79}$/', $sprite) || isset($seen[$sprite])) {
                    throw new InvalidArgumentException('Sprite inválido o repetido: ' . $sprite);
                }
                $seen[$sprite] = true;
                if (CatalogItem::where('sprite_name', $sprite)->exists()) {
                    throw new InvalidArgumentException('Sprite existente; no se sobrescribe: ' . $sprite);
                }

                $license = $entry['asset_rights_status'] ?? '';
                $evidence = trim((string) ($entry['rights_evidence'] ?? ''));
                if (!in_array($license, ['original', 'licensed'], true) || $evidence === '') {
                    throw new InvalidArgumentException('Se requiere permiso y justificación documentada para ' . $sprite);
                }
                $name = trim((string) ($entry['name'] ?? ''));
                if ($name === '' || mb_strlen($name) > 200) throw new InvalidArgumentException('Nombre inválido');
                $rarity = (string) ($entry['rarity_code'] ?? 'comun');
                if (!array_key_exists($rarity, CatalogRarity::labels())) {
                    throw new InvalidArgumentException('Rareza no reconocida: ' . $rarity);
                }
                $category = (int) ($entry['category_id'] ?? 0);
                if ($category < 1 || !CatalogCategory::whereKey($category)->exists()) {
                    throw new InvalidArgumentException('Es necesaria una categoría de catálogo existente: ' . $sprite);
                }
                $price = $entry['price'] ?? null;
                $currency = (string) ($entry['price_type'] ?? 'golden_coins');
                if (!is_int($price) || $price < 0 ||
                    !in_array($currency, ['golden_coins', 'silver_coins'], true)) {
                    throw new InvalidArgumentException('Precio o moneda inválida para ' . $sprite);
                }

                $map = $entry['map_size'] ?? [[0, 0]];
                if (!is_array($map) || count($map) < 1 || count($map) > 256) {
                    throw new InvalidArgumentException('Huella de colocación inválida: ' . $sprite);
                }
                $footprint = [];
                foreach ($map as $tile) {
                    if (!is_array($tile) || count($tile) !== 2 ||
                        !is_int($tile[0]) || !is_int($tile[1])) {
                        throw new InvalidArgumentException('Las casillas deben ser pares de enteros.');
                    }
                    $footprint[$tile[0] . ',' . $tile[1]] = true;
                }
                if (count($footprint) !== count($map)) throw new InvalidArgumentException('Casillas duplicadas');

                $preview = $this->readImage($base, (string) ($entry['image_file'] ?? ''));
                $texture = $this->readImage($base, (string) ($entry['texture_file'] ?? ($entry['image_file'] ?? '')));
                $validated[] = compact('sprite', 'name', 'license', 'evidence', 'rarity', 'category', 'price', 'currency', 'map', 'preview', 'texture');
            }

            if ($this->option('dry-run')) {
                foreach ($validated as $entry) {
                    $this->line("OK {$entry['sprite']} ({$entry['texture']['width']} × {$entry['texture']['height']} px)");
                }
                $this->info(count($validated) . ' objetos validados; no se modificaron archivos ni base de datos.');
                return self::SUCCESS;
            }

            foreach ($validated as $entry) {
                $folder = 'uploads/catalog/authorized/' . $entry['sprite'];
                $previewPath = $folder . '/preview.' . $entry['preview']['extension'];
                $texturePath = $folder . '/texture.' . $entry['texture']['extension'];
                $disk = Storage::disk('uploads');
                try {
                    if (!$disk->put($previewPath, file_get_contents($entry['preview']['path'])) ||
                        !$disk->put($texturePath, file_get_contents($entry['texture']['path']))) {
                        throw new InvalidArgumentException('No se pudo guardar el sprite ' . $entry['sprite']);
                    }
                    CatalogItem::create([
                        'name' => ['es' => $entry['name']],
                        'description' => ['es' => 'Objeto de BoomBangCL con imágenes verificadas.'],
                        'category_id' => $entry['category'],
                        'sprite_name' => $entry['sprite'],
                        'image' => $previewPath,
                        'spreadsheet' => $texturePath,
                        'width' => $entry['texture']['width'],
                        'height' => $entry['texture']['height'],
                        'map_size' => json_encode($entry['map'], JSON_THROW_ON_ERROR),
                        'price' => $entry['price'],
                        'price_type' => $entry['currency'],
                        'rarity_code' => $entry['rarity'],
                        'asset_rights_status' => $entry['license'],
                        'asset_rights_evidence' => $entry['evidence'],
                        'is_reference_only' => false,
                        'is_multi_buy' => true,
                        'is_purchasable' => (bool) $this->option('activate'),
                        'is_active' => (bool) $this->option('activate'),
                    ]);
                } catch (Throwable $error) {
                    $disk->delete([$previewPath, $texturePath]);
                    throw $error;
                }
                $this->info('Importado: ' . $entry['name']);
            }
            return self::SUCCESS;
        } catch (Throwable $error) {
            $this->error($error->getMessage());
            return self::FAILURE;
        }
    }

    private function safePath(string $base, string $relative): string
    {
        $root = realpath($base);
        if (!$root || $relative === '' || str_contains($relative, "\0")) {
            throw new InvalidArgumentException('Carpeta o nombre de archivo inválido.');
        }
        $path = realpath($root . DIRECTORY_SEPARATOR . $relative);
        if (!$path || !str_starts_with($path, $root . DIRECTORY_SEPARATOR) || !is_file($path)) {
            throw new InvalidArgumentException('El archivo debe estar dentro de storage/app/catalog-import.');
        }
        return $path;
    }

    private function readImage(string $base, string $relative): array
    {
        $file = $this->safePath($base, $relative);
        $info = @getimagesize($file);
        if (!$info || !in_array($info[2], [IMAGETYPE_PNG, IMAGETYPE_WEBP], true)) {
            throw new InvalidArgumentException('Solo se admiten imágenes PNG y WebP válidas: ' . $relative);
        }
        if ($info[0] < 1 || $info[1] < 1 || $info[0] > 4096 || $info[1] > 4096) {
            throw new InvalidArgumentException('Dimensiones fuera del rango permitido: ' . $relative);
        }
        return [
            'path' => $file,
            'extension' => $info[2] === IMAGETYPE_PNG ? 'png' : 'webp',
            'width' => $info[0],
            'height' => $info[1],
        ];
    }
}
