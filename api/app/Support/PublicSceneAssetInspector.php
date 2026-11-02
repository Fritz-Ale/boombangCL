<?php

namespace App\Support;

/**
 * Read-only inventory for the background sprites referenced by public_scenes.
 * Checks the actual Laravel public filesystem (including Docker's api_uploads
 * volume), not just the historical uploads.zip in the repository.
 */
final class PublicSceneAssetInspector
{
    public static function inspect(?string $json, string $publicRoot): array
    {
        $decoded = json_decode($json ?: '{}', true);
        $items = is_array($decoded) ? ($decoded['assets_data_repeatable'] ?? []) : [];
        $items = is_array($items) && array_is_list($items) ? $items : [];

        $results = [];
        foreach ($items as $item) {
            if (!is_array($item) || !in_array($item['is_background'] ?? null, [1, '1', true], true)) {
                continue;
            }

            $source = $item['image'] ?? null;
            if (!is_string($source) || trim($source) === '') {
                $results[] = ['path' => '', 'status' => 'invalid'];
                continue;
            }

            $source = trim($source);
            if (preg_match('#^(https?:)?//#i', $source)) {
                // A local file test cannot validate remote CDN resources.
                $results[] = ['path' => $source, 'status' => 'remote_unverified'];
                continue;
            }

            $path = ltrim(str_replace('\\', '/', $source), '/');
            $segments = explode('/', $path);
            if (
                count($segments) < 3 ||
                $segments[0] !== 'uploads' ||
                in_array('..', $segments, true) ||
                in_array('.', $segments, true) ||
                in_array('', $segments, true)
            ) {
                $results[] = ['path' => $source, 'status' => 'invalid'];
                continue;
            }

            $file = rtrim($publicRoot, DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR
                . implode(DIRECTORY_SEPARATOR, $segments);
            $realRoot = realpath($publicRoot);
            $realFile = realpath($file);
            if (
                !$realRoot ||
                !$realFile ||
                !str_starts_with($realFile, $realRoot . DIRECTORY_SEPARATOR) ||
                !is_file($realFile) ||
                !is_readable($realFile) ||
                filesize($realFile) === 0
            ) {
                $results[] = ['path' => $source, 'status' => 'missing'];
                continue;
            }
            $results[] = ['path' => $source, 'status' => 'ok'];
        }

        return $results;
    }
}
