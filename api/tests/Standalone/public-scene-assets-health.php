<?php

require_once __DIR__ . '/../../app/Support/PublicSceneAssetDiagnostics.php';

use App\Support\PublicSceneAssetDiagnostics as Audit;

function assertAssetHealth(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function hasAssetIssue(array $report, string $code): bool
{
    foreach ($report['scenes'][0]['issues'] as $issue) {
        if ($issue['code'] === $code) {
            return true;
        }
    }
    return false;
}

function publicScene(int $id, mixed $assets): array
{
    return [
        'id' => $id,
        'name' => $id === 1 ? 'UFO' : 'Ring',
        'assets_data' => is_string($assets) ? $assets : json_encode(['assets_data_repeatable' => $assets]),
    ];
}

$base = sys_get_temp_dir() . '/boombang-scenes-audit-' . bin2hex(random_bytes(8));
$folder = $base . '/uploads/public-scene/ufo/assets';
mkdir($folder, 0775, true);
$valid = 'uploads/public-scene/ufo/assets/fondo.webp';
$validPath = $base . '/' . $valid;
file_put_contents($validPath, 'WEBP_TEST_BYTES');

try {
    $healthy = Audit::inspect([publicScene(1, [
        ['image' => $valid, 'is_background' => 1]
    ])], $base);
    assertAssetHealth($healthy['scenes_ok'] === 1, 'An available UFO background must pass');
    assertAssetHealth($healthy['scenes_problematic'] === 0, 'Healthy UFO should report no issues');
    assertAssetHealth($healthy['scenes'][0]['backgrounds_present'] === 1, 'Background must be found');

    $missing = Audit::inspect([publicScene(1, [
        ['image' => 'uploads/public-scene/ufo/assets/missing.webp', 'is_background' => 1]
    ])], $base);
    assertAssetHealth($missing['scenes_problematic'] === 1, 'Missing background must fail');
    assertAssetHealth(hasAssetIssue($missing, 'asset_file_missing'), 'Missing file should be identified');
    assertAssetHealth(hasAssetIssue($missing, 'background_unavailable'), 'Unavailable background should be identified');

    $noAssets = Audit::inspect([publicScene(1, 'invalid JSON')], $base);
    assertAssetHealth(hasAssetIssue($noAssets, 'assets_data_invalid'), 'Invalid JSON should be rejected');
    assertAssetHealth(hasAssetIssue($noAssets, 'background_not_configured'), 'Missing JSON must not pass');

    $empty = Audit::inspect([publicScene(1, [])], $base);
    assertAssetHealth(hasAssetIssue($empty, 'background_not_configured'), 'No background must not pass');

    $external = Audit::inspect([publicScene(1, [
        ['image' => 'https://cdn.example.test/assets/ufo.webp?token=x', 'is_background' => '1']
    ])], $base);
    assertAssetHealth($external['scenes_problematic'] === 1, 'External URL cannot be certified by local checks');
    assertAssetHealth(hasAssetIssue($external, 'external_asset_unverified'), 'External URL should be marked unverified');

    $traversal = Audit::inspect([publicScene(1, [
        ['image' => 'uploads/../config/database.php', 'is_background' => 1]
    ])], $base);
    assertAssetHealth(hasAssetIssue($traversal, 'asset_path_unsafe'), 'Traversal must be rejected');

    $absolute = Audit::inspect([publicScene(1, [
        ['image' => '/etc/passwd', 'is_background' => 1]
    ])], $base);
    assertAssetHealth(hasAssetIssue($absolute, 'asset_path_unsafe'), 'Unknown absolute files must be rejected');

    $emptyFile = 'uploads/public-scene/ufo/assets/empty.webp';
    file_put_contents($base . '/' . $emptyFile, '');
    $zero = Audit::inspect([publicScene(1, [
        ['image' => $emptyFile, 'is_background' => 1]
    ])], $base);
    assertAssetHealth(hasAssetIssue($zero, 'asset_file_missing'), 'Zero-byte files must be rejected');

    $partial = Audit::inspect([publicScene(1, [
        ['image' => $valid, 'is_background' => 1],
        ['image' => 'uploads/public-scene/ufo/assets/item-missing.png', 'is_background' => 0],
    ])], $base);
    assertAssetHealth($partial['scenes'][0]['backgrounds_present'] === 1, 'Available background stays present');
    assertAssetHealth($partial['scenes_problematic'] === 1, 'Missing decoration needs attention');

    $multiple = Audit::inspect([
        (object) publicScene(1, [['image' => $valid, 'is_background' => 1]]),
        publicScene(2, [['image' => 'uploads/missing.webp', 'is_background' => 1]]),
    ], $base);
    assertAssetHealth($multiple['scenes_checked'] === 2, 'Must handle all scenes in a batch');
    assertAssetHealth($multiple['scenes_ok'] === 1, 'Only one scene must be healthy');

    $missingRoot = Audit::inspect([publicScene(1, [
        ['image' => $valid, 'is_background' => 1]
    ])], $base . '/not-an-existing-folder');
    assertAssetHealth(hasAssetIssue($missingRoot, 'public_root_unavailable'), 'Unavailable volume must be reported');

    if (function_exists('symlink')) {
        $outside = sys_get_temp_dir() . '/bb-scenes-outside-' . bin2hex(random_bytes(8));
        file_put_contents($outside, 'PRIVATE');
        $link = $folder . '/outside.webp';
        if (@symlink($outside, $link)) {
            $escaped = Audit::inspect([publicScene(1, [
                ['image' => 'uploads/public-scene/ufo/assets/outside.webp', 'is_background' => 1]
            ])], $base);
            assertAssetHealth(hasAssetIssue($escaped, 'asset_file_missing'), 'Symlink outside public root must be rejected');
            unlink($link);
        }
        unlink($outside);
    }

    echo "OK: public-scene runtime diagnostics reject incomplete and unsafe assets\n";
} finally {
    @unlink($validPath);
    @unlink($base . '/uploads/public-scene/ufo/assets/empty.webp');
    @rmdir($folder);
    @rmdir($base . '/uploads/public-scene/ufo');
    @rmdir($base . '/uploads/public-scene');
    @rmdir($base . '/uploads');
    @rmdir($base);
}
