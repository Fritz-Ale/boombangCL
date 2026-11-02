<?php

namespace Database\Seeders;

use App\Models\CatalogItem;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Investigación opcional: no ejecutar desde DatabaseSeeder.
 * Crea fichas inactivas, NO compra ni importa arte ajeno.
 */
class CatalogReferenceSeeder extends Seeder
{
    public function run(): void
    {
        $file = database_path('reference/boombang_tv_2026_11.json');
        $document = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

        foreach ($document['objects'] as $object) {
            $spriteKey = 'research_bbtv_' . Str::slug($object['name'], '_');
            CatalogItem::firstOrCreate(
                ['sprite_name' => $spriteKey],
                [
                    'name' => ['es' => 'Referencia: ' . $object['name'], 'en' => 'Reference: ' . $object['name']],
                    'description' => ['es' => 'Referencia documental. No disponible para compra. Arte original no incorporado.'],
                    'rarity_code' => $object['rarity_code'],
                    'reference_source_url' => $object['source_url'],
                    'reference_copy_count' => null,
                    'asset_rights_status' => 'unverified',
                    'is_reference_only' => true,
                    'is_purchasable' => false,
                    'is_active' => false,
                    'price' => 0,
                    'category_id' => null,
                    'image' => null,
                    'width' => null,
                    'height' => null,
                    'map_size' => null,
                ]
            );
        }
    }
}
