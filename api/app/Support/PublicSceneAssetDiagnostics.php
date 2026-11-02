<?php

namespace App\Support;

/**
 * Read-only diagnostics for the public assets mounted in the *running* API.
 *
 * ZIP metadata does not prove a file is present in Docker's api_uploads
 * volume. This checks only public scene media referenced by database rows,
 * never extracts, writes or makes external HTTP requests.
 */
final class PublicSceneAssetDiagnostics
{
    public static function inspect(iterable $scenes, string $publicRoot): array
    {
        $root = realpath($publicRoot);
        $results = [];

        foreach ($scenes as $scene) {
            $id = self::field($scene, 'id');
            $name = (string) (self::field($scene, 'name') ?? '');
            $issues = [];
            $assetsTotal = 0;
            $assetsPresent = 0;
            $backgroundsTotal = 0;
            $backgroundsPresent = 0;
            $unverified = 0;

            $raw = self::field($scene, 'assets_data');
            if (is_string($raw)) {
                $decoded = json_decode($raw, true);
            } elseif (is_array($raw)) {
                $decoded = $raw;
            } else {
                $decoded = null;
            }

            $entries = is_array($decoded) ? ($decoded['assets_data_repeatable'] ?? null) : null;
            if (!is_array($entries) || !array_is_list($entries)) {
                $issues[] = ['code' => 'assets_data_invalid', 'path' => '', 'severity' => 'error'];
                $entries = [];
            }

            if ($root === false) {
                $issues[] = ['code' => 'public_root_unavailable', 'path' => '', 'severity' => 'error'];
            }

            foreach ($entries as $entry) {
                if (!is_array($entry)) {
                    $issues[] = ['code' => 'asset_entry_invalid', 'path' => '', 'severity' => 'error'];
                    continue;
                }
                $assetsTotal++;
                $isBackground = in_array($entry['is_background'] ?? null, [1, '1', true], true);
                if ($isBackground) {
                    $backgroundsTotal++;
                }

                $assetPath = $entry['image'] ?? null;
                if (!is_string($assetPath) || trim($assetPath) === '') {
                    $issues[] = ['code' => 'asset_path_missing', 'path' => '', 'severity' => 'error'];
                    continue;
                }
                $assetPath = trim($assetPath);

                // URLs managed by an external CDN cannot be verified with
                // local filesystem checks; do not misreport them as healthy.
                if (preg_match('~^(https?://|//)~i', $assetPath)) {
                    $unverified++;
                    $issues[] = ['code' => 'external_asset_unverified', 'path' => '', 'severity' => 'warning'];
                    continue;
                }

                $relative = self::safePath($assetPath);
                if ($relative === null) {
                    $issues[] = ['code' => 'asset_path_unsafe', 'path' => '', 'severity' => 'error'];
                    continue;
                }

                $filename = $root !== false ? $root . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative) : '';
                $existingPath = $filename !== '' ? realpath($filename) : false;
                $inside = $root !== false && $existingPath !== false
                    && str_starts_with($existingPath, $root . DIRECTORY_SEPARATOR);

                if (!$inside || !is_file($existingPath) || !is_readable($existingPath) || filesize($existingPath) <= 0) {
                    $issues[] = ['code' => 'asset_file_missing', 'path' => $relative, 'severity' => 'error'];
                    continue;
                }

                $assetsPresent++;
                if ($isBackground) {
                    $backgroundsPresent++;
                }
            }

            if ($backgroundsTotal === 0) {
                $issues[] = ['code' => 'background_not_configured', 'path' => '', 'severity' => 'error'];
            } elseif ($backgroundsPresent === 0) {
                $issues[] = ['code' => 'background_unavailable', 'path' => '', 'severity' => 'error'];
            }

            $errors = count(array_filter($issues, static fn (array $i): bool => $i['severity'] === 'error'));
            $results[] = [
                'id' => $id,
                'name' => $name,
                'status' => $errors > 0 ? 'error' : ($unverified > 0 ? 'unverified' : 'ok'),
                'assets_total' => $assetsTotal,
                'assets_present' => $assetsPresent,
                'backgrounds_total' => $backgroundsTotal,
                'backgrounds_present' => $backgroundsPresent,
                'issues' => $issues,
            ];
        }

        return [
            'scenes_checked' => count($results),
            'scenes_ok' => count(array_filter($results, static fn (array $scene): bool => $scene['status'] === 'ok')),
            'scenes_problematic' => count(array_filter($results, static fn (array $scene): bool => $scene['status'] !== 'ok')),
            'scenes' => $results,
        ];
    }

    private static function field(mixed $record, string $key): mixed
    {
        if (is_array($record)) {
            return $record[$key] ?? null;
        }
        return is_object($record) ? ($record->{$key} ?? null) : null;
    }

    /**
     * Accept only files under public/uploads or public/storage.
     * Prevent traversals and accidental absolute paths outside the web root.
     */
    private static function safePath(string $path): ?string
    {
        if (str_contains($path, '\\') || str_contains($path, '?') || str_contains($path, '#')
            || str_contains($path, ':') || str_contains($path, "\0")) {
            return null;
        }

        $relative = ltrim($path, '/');
        if (!str_starts_with($relative, 'uploads/') && !str_starts_with($relative, 'storage/')) {
            return null;
        }

        foreach (explode('/', $relative) as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                return null;
            }
        }
        return $relative;
    }
}
