<?php

require __DIR__ . '/../../app/Support/CatalogRarity.php';

use App\Support\CatalogRarity;

$cases = [
    [1,'singular'], [2,'duo'], [3,'triada'],
    [4,'casi_unico'], [10,'casi_unico'],
    [11,'excepcional'], [25,'excepcional'],
    [26,'legendario'], [50,'legendario'],
    [51,'reliquia'], [100,'reliquia'],
    [101,'muy_rare'], [250,'muy_rare'], [251,'rare'],
    [10000,'rare'],
];

foreach ($cases as [$copies, $expected]) {
    $got = CatalogRarity::fromCopies($copies);
    if ($got !== $expected) {
        throw new RuntimeException("Expected $expected with $copies copies, got $got");
    }
}
foreach (['comun','singular','duo','triada','casi_unico','excepcional','legendario','reliquia','muy_rare','rare','ltd','evento'] as $code) {
    if (!isset(CatalogRarity::labels()[$code])) {
        throw new RuntimeException("Unknown rarity code: $code");
    }
}
try {
    CatalogRarity::fromCopies(0);
    throw new RuntimeException('A zero quantity is invalid');
} catch (InvalidArgumentException $expected) {}

$reference = json_decode(file_get_contents(__DIR__ . '/../../database/reference/boombang_tv_2026_11.json'), true, 512, JSON_THROW_ON_ERROR);
if (count($reference['objects']) < 40) {
    throw new RuntimeException('Expected initial reference list');
}
foreach ($reference['objects'] as $item) {
    if (!isset(CatalogRarity::labels()[$item['rarity_code']])) {
        throw new RuntimeException('Bad rarity for ' . $item['name']);
    }
    if ($item['original_image'] !== null || $item['width'] !== null || $item['height'] !== null) {
        throw new RuntimeException('Unverified references must not declare original art dimensions');
    }
}
echo "OK: rarity boundaries, validated reference-only catalog, and 47+ records\n";
