<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Validation boundary for decorating private scenes.
 * The browser and Socket.IO server validate too, but API calls must not
 * trust a client-supplied footprint or the area identified in the request.
 */
final class PrivateScenePlacementValidator
{
    public static function decodedTiles(mixed $value, array $fallback = []): array
    {
        if (is_string($value)) {
            $value = json_decode($value, true);
        }
        if (!is_array($value) || !array_is_list($value) ||
            count($value) < 1 || count($value) > 256) {
            return $fallback;
        }
        $seen = [];
        foreach ($value as $tile) {
            if (!is_array($tile) || count($tile) !== 2 ||
                !isset($tile[0], $tile[1]) || !is_int($tile[0]) || !is_int($tile[1]) ||
                $tile[0] < 0 || $tile[1] < 0) {
                return $fallback;
            }
            $key = $tile[0] . ',' . $tile[1];
            if (isset($seen[$key])) {
                return $fallback;
            }
            $seen[$key] = true;
        }
        return $value;
    }

    /**
     * $otherItems entries: ['id'=>int, 'tiles'=>array|string, 'behavior'=>string].
     */
    public static function assertValid(
        array $proposed,
        mixed $rawMap,
        mixed $rawFootprint,
        array $otherItems,
        int $selfId,
        string $behavior
    ): void {
        $map = is_string($rawMap) ? json_decode($rawMap, true) : $rawMap;
        $footprint = self::decodedTiles($rawFootprint, [[0, 0]]);
        $tiles = self::decodedTiles($proposed);
        if (!is_array($map) || !array_is_list($map) || !$map ||
            !$tiles || count($footprint) !== count($tiles)) {
            throw new InvalidArgumentException('Mapa o huella de objeto inválidos.');
        }

        // Compare the exact footprint translated, not merely its cell count.
        $offsetX = $tiles[0][0] - $footprint[0][0];
        $offsetY = $tiles[0][1] - $footprint[0][1];
        $actual = array_fill_keys(array_map(
            fn (array $tile): string => $tile[0] . ',' . $tile[1],
            $tiles
        ), true);
        foreach ($footprint as [$x, $y]) {
            if (!isset($actual[($x + $offsetX) . ',' . ($y + $offsetY)])) {
                throw new InvalidArgumentException('La colocación altera la huella del objeto.');
            }
        }

        foreach ($tiles as [$x, $y]) {
            if (!isset($map[$y]) || !is_array($map[$y]) ||
                !array_key_exists($x, $map[$y]) || $map[$y][$x] !== 0) {
                throw new InvalidArgumentException('Casilla fuera del mapa o no transitable.');
            }
        }

        $isWalkable = in_array($behavior, ['walkable', 'walkable_overlay'], true);
        foreach ($otherItems as $other) {
            if ((int) ($other['id'] ?? -1) === $selfId) {
                continue;
            }
            $existing = self::decodedTiles($other['tiles'] ?? []);
            if (!$existing && !in_array($other['tiles'] ?? null, ['[]', []], true)) {
                // Fail closed if existing decoration has corrupt footprint data.
                throw new InvalidArgumentException('La sala contiene un objeto con posición inválida.');
            }
            $existingWalkable = in_array($other['behavior'] ?? null, ['walkable', 'walkable_overlay'], true);
            foreach ($existing as [$x, $y]) {
                if (isset($actual[$x . ',' . $y]) && (!$existingWalkable || $isWalkable)) {
                    throw new InvalidArgumentException('Casilla ocupada por otro objeto.');
                }
            }
        }
    }
}
