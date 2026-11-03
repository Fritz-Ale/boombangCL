<?php
declare(strict_types=1);

// Ejecuta el seeder sin una base real y rechaza cualquier borrado implícito.
// Requiere únicamente PHP; los tests completos de MySQL son independientes.
namespace Illuminate\Database {
    abstract class Seeder {}
}

namespace {
    final class FakePublicSceneTable
    {
        public function delete(): never
        {
            throw new \RuntimeException('PublicScenesTableSeeder no debe borrar salas existentes.');
        }

        public function insert(array $records): never
        {
            throw new \RuntimeException('Utiliza insertOrIgnore para evitar sobreescrituras.');
        }

        public function insertOrIgnore(array $records): int
        {
            $added = 0;
            foreach ($records as $record) {
                if (!isset(DB::$records[$record['id']])) {
                    DB::$records[$record['id']] = $record;
                    $added++;
                }
            }

            return $added;
        }
    }

    final class DB
    {
        public static array $records = [
            1 => [
                'id' => 1,
                'name' => 'UFO',
                'assets_data' => '{"backgrounds":["custom-ufo.webp"]}',
                'map' => 'custom-edited-map'
            ],
            99 => [
                'id' => 99,
                'name' => 'Sala comunitaria',
                'assets_data' => '{"backgrounds":["community.webp"]}'
            ]
        ];

        public static function table(string $table): FakePublicSceneTable
        {
            if ($table !== 'public_scenes') {
                throw new \RuntimeException('Tabla inesperada');
            }
            return new FakePublicSceneTable();
        }
    }

    require __DIR__ . '/../../database/seeders/PublicScenesTableSeeder.php';
    $seeder = new \Database\Seeders\PublicScenesTableSeeder();
    $before = DB::$records[1];

    $seeder->run();
    if (DB::$records[1] !== $before || !isset(DB::$records[99]) ||
        !isset(DB::$records[2]) || DB::$records[2]['name'] !== 'Ring') {
        throw new \RuntimeException('El seeder borró datos o no creó la sala faltante.');
    }

    $afterFirstRun = DB::$records;
    $seeder->run();
    if (DB::$records !== $afterFirstRun) {
        throw new \RuntimeException('El seeder no es idempotente.');
    }

    echo "OK: UFO conserva assets_data, sala 99 preservada, Ring creado, segundo seed sin cambios\n";
}
