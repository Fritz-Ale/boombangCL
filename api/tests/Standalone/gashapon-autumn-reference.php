<?php
declare(strict_types=1);

$path = __DIR__ . '/../../database/reference/boombang_tv_gashapon_autumn_2026.json';
$data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);

if ($data['source_url'] !== 'https://www.boombang.tv/es/news/otono-en-el-gashapon-hasta-el-30-de-noviembre-962') {
    throw new RuntimeException('La referencia debe conservar su fuente oficial.');
}
if ($data['available_through'] !== '2026-11-30' || count($data['pools']) !== 2) {
    throw new RuntimeException('La temporada o los grupos del gashapon no coinciden.');
}

$seen = [];
$counts = ['animated_object' => 0, 'medal_container' => 0];
$expectedPools = [
    'normal' => ['count' => 16, 'cost' => 5000, 'currency' => 'oro'],
    'premium' => ['count' => 9, 'cost' => 2000, 'currency' => 'diamantes'],
];

foreach ($data['pools'] as $pool) {
    $name = $pool['code'];
    if (!isset($expectedPools[$name]) || count($pool['entries']) !== $expectedPools[$name]['count']) {
        throw new RuntimeException('Faltan premios en el grupo ' . $name);
    }
    if ($pool['historical_spin_cost']['amount'] !== $expectedPools[$name]['cost'] ||
        $pool['historical_spin_cost']['currency'] !== $expectedPools[$name]['currency']) {
        throw new RuntimeException('El precio por tirada histórico no corresponde.');
    }
    $probability = 0.0;
    foreach ($pool['entries'] as $item) {
        $itemName = $item['name'];
        if (!is_string($itemName) || trim($itemName) === '' || isset($seen[$itemName])) {
            throw new RuntimeException('Nombre faltante o duplicado en el catálogo de referencia.');
        }
        $seen[$itemName] = true;
        if (!array_key_exists($item['kind'], $counts)) {
            throw new RuntimeException('Tipo de premio no soportado.');
        }
        ++$counts[$item['kind']];
        $weight = $item['draw_probability_percent'];
        if (!is_numeric($weight) || $weight <= 0 || $weight > 100) {
            throw new RuntimeException('Probabilidad de premio inválida.');
        }
        $probability += $weight;
        if ($item['reference_only'] !== true || $item['asset_rights_status'] !== 'unverified' ||
            $item['original_item_id'] !== null || $item['rarity_code'] !== null) {
            throw new RuntimeException('Las referencias no pueden habilitar compras ni inferir rarezas.');
        }
        foreach (['image', 'texture', 'atlas', 'width', 'height'] as $field) {
            if (!array_key_exists($field, $item) || $item[$field] !== null) {
                throw new RuntimeException('No se permiten imágenes o dimensiones sin verificar.');
            }
        }
    }
    $expectedTotal = $name === 'normal' ? 100.0 : 99.9;
    if (abs($probability - $expectedTotal) > 0.001) {
        throw new RuntimeException('Las probabilidades oficiales no coinciden en ' . $name);
    }
}

if ($counts['animated_object'] !== 18 || $counts['medal_container'] !== 7 || count($seen) !== 25) {
    throw new RuntimeException('El número de objetos animados o medallas no coincide con la noticia.');
}
echo "OK: 18 objetos, 7 medallas, probabilidades oficiales y referencias sin activar\n";
