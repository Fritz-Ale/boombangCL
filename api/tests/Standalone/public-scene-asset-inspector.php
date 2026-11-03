<?php
declare(strict_types=1);

require __DIR__ . '/../../app/Support/PublicSceneAssetInspector.php';

use App\Support\PublicSceneAssetInspector;

function checkStatus(?string $json, string $root, array $expected): void
{
    $actual = array_column(PublicSceneAssetInspector::inspect($json, $root), 'status');
    if ($actual !== $expected) {
        throw new RuntimeException('Estados erróneos: ' . json_encode([$actual, $expected]));
    }
}

$root = sys_get_temp_dir() . '/boombangcl-scene-assets-' . bin2hex(random_bytes(6));
$assets = $root . '/uploads/public-scene/ufo/assets';
mkdir($assets, 0700, true);
file_put_contents($assets . '/fondo.webp', 'mock-image-data');
file_put_contents($assets . '/empty.webp', '');

try {
    checkStatus(null, $root, []);
    checkStatus('{not-json', $root, []);
    checkStatus(json_encode(['assets_data_repeatable' => ['not-an-object']]), $root, []);
    checkStatus(json_encode(['assets_data_repeatable' => [
        ['is_background' => 1, 'image' => 'uploads/public-scene/ufo/assets/fondo.webp'],
        ['is_background' => '1', 'image' => '/uploads/public-scene/ufo/assets/missing.webp'],
        ['is_background' => true, 'image' => 'uploads/public-scene/ufo/assets/empty.webp'],
        ['is_background' => 0, 'image' => 'uploads/non-background.webp'],
    ]]), $root, ['ok', 'missing', 'missing']);
    checkStatus(json_encode(['assets_data_repeatable' => [
        ['is_background' => 1, 'image' => '../../etc/passwd'],
        ['is_background' => 1, 'image' => 'uploads/../secret.png'],
        ['is_background' => 1, 'image' => 'https://cdn.example.test/fondo.webp'],
        ['is_background' => 1, 'image' => ''],
    ]]), $root, ['invalid', 'invalid', 'remote_unverified', 'invalid']);

    $outside = sys_get_temp_dir() . '/boombangcl-scene-outside-' . bin2hex(random_bytes(6));
    file_put_contents($outside, 'outside');
    symlink($outside, $assets . '/escape.webp');
    checkStatus(json_encode(['assets_data_repeatable' => [
        ['is_background' => 1, 'image' => 'uploads/public-scene/ufo/assets/escape.webp']
    ]]), $root, ['missing']);
    unlink($assets . '/escape.webp');
    unlink($outside);
    echo "OK: se validan fondos, errores, rutas externas, symlinks y archivos vacíos\n";
} finally {
    @unlink($assets . '/fondo.webp');
    @unlink($assets . '/empty.webp');
    @rmdir($assets);
    @rmdir(dirname($assets));
    @rmdir(dirname(dirname($assets)));
    @rmdir(dirname(dirname(dirname($assets))));
    @rmdir($root);
}
