<?php
declare(strict_types=1);

require __DIR__ . '/../../app/Support/PrivateScenePlacementValidator.php';
use App\Support\PrivateScenePlacementValidator as Placement;

$map = '[[0,0,1],[0,0,0]]';
$footprint = '[[0,0],[1,0]]';
$assertAccepted = static function (array $position, array $others = [], string $behavior = 'normal') use ($map, $footprint): void {
    Placement::assertValid($position, $map, $footprint, $others, 35, $behavior);
};
$assertRejected = static function (array $position, array $others = [], string $behavior = 'normal') use ($assertAccepted): void {
    try {
        $assertAccepted($position, $others, $behavior);
        throw new RuntimeException('Se aceptó colocación inválida');
    } catch (InvalidArgumentException $expected) {
        // Correcto: Laravel rechaza este movimiento incluso si la petición evita Socket.IO.
    }
};

$assertAccepted([[0, 0], [1, 0]]);
$assertAccepted([[0, 1], [1, 1]]);
$assertRejected([[1, 0], [2, 0]]); // Terreno bloqueado
$assertRejected([[2, 1], [3, 1]]); // Fuera de límites
$assertRejected([[0, 0]]); // Huella deformada
$assertRejected([[0, 0], [0, 1]]); // Huella rotada sin configuración
$assertRejected([[0, 0], [0, 0]]); // Celdas duplicadas
$assertRejected([[0, 0], [null, 0]]); // Coordenadas inválidas

$placed = [['id' => 11, 'tiles' => '[[0,0]]', 'behavior' => 'normal']];
$assertRejected([[0, 0], [1, 0]], $placed);
$walkable = [['id' => 11, 'tiles' => '[[0,0]]', 'behavior' => 'walkable']];
$assertAccepted([[0, 0], [1, 0]], $walkable);
$assertRejected([[0, 0], [1, 0]], $walkable, 'walkable');
$self = [['id' => 35, 'tiles' => '[[0,0],[1,0]]', 'behavior' => 'normal']];
$assertAccepted([[0, 1], [1, 1]], $self);

if (Placement::decodedTiles('not-json') !== [] ||
    Placement::decodedTiles('[[0,0],[0,0]]') !== [] ||
    Placement::decodedTiles('[[0,0]]') !== [[0, 0]]) {
    throw new RuntimeException('Decodificación de celdas inconsistente');
}

echo "OK: validaciones de huella, mapa, límites, duplicados, colisiones y alfombras\n";
